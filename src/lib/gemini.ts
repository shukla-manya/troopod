import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { getGeminiKey } from "./env";
import type { AdInput, ScopedElement } from "./validators";

export type { Part };

let _client: GoogleGenerativeAI | null = null;

const SYSTEM_PROMPT = `You are a Conversion Rate Optimization (CRO) specialist and copywriter.
Your task: given an ad creative image and a snapshot of landing page elements, suggest targeted text modifications that improve message match between the ad and the page.

RULES — you must follow ALL of these:
1. Return ONLY valid JSON matching the schema below. No markdown, no explanation, no code fences.
2. Only modify elements present in the "elements" array provided to you.
3. Use the EXACT selector string from the input for each modification. Do not invent selectors.
4. Never modify CSS classes, attributes, images, or layout.
5. New text must be concise: headings ≤ 12 words, CTAs ≤ 5 words, paragraphs ≤ 40 words.
6. Preserve the brand's tone — match the formality and energy of the original text.
7. Only suggest a modification if it genuinely improves message match or conversion. If an element is already well-aligned, omit it.
8. Include a one-sentence "reasoning" per modification explaining why it improves conversion.

Output schema (strict JSON):
{
  "adAnalysis": {
    "primaryMessage": string,
    "targetAudience": string,
    "emotionalHook": string,
    "keyTerms": string[]
  },
  "modifications": [
    {
      "selector": string,
      "tag": "h1" | "h2" | "h3" | "p" | "button" | "a" | "meta",
      "originalText": string,
      "suggestedText": string,
      "reasoning": string,
      "confidence": "high" | "medium" | "low"
    }
  ],
  "summary": {
    "headline": string,
    "bullets": string[]
  },
  "cro_principles_applied": string[]
}`;

function getModel() {
  if (!_client) {
    _client = new GoogleGenerativeAI(getGeminiKey());
  }
  return _client.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
  });
}

export async function buildImagePart(adInput: AdInput): Promise<Part> {
  if (adInput.type === "file") {
    const [header, data] = adInput.value.split(",");
    const mimeType = header.replace("data:", "").replace(";base64", "") as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";
    return { inlineData: { mimeType, data } };
  }

  const res = await fetch(adInput.value);
  if (!res.ok) throw new Error(`Failed to fetch ad image: ${res.status}`);
  const mimeType = (res.headers.get("content-type") ?? "image/jpeg").split(";")[0] as
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp";
  const buffer = await res.arrayBuffer();
  const data = Buffer.from(buffer).toString("base64");
  return { inlineData: { mimeType, data } };
}

function is429(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || msg.includes("Too Many Requests");
}

function isDailyQuotaExceeded(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("PerDay") || msg.includes("per_day") || msg.includes("daily");
}

function parseRetryDelayMs(err: unknown): number {
  const msg = err instanceof Error ? err.message : String(err);
  // parse structured retryDelay e.g. "retryDelay":"12s"
  const secMatch = msg.match(/"retryDelay":"(\d+)s"/);
  if (secMatch) return parseInt(secMatch[1], 10) * 1000;
  // parse inline text e.g. "Please retry in 500ms"
  const msMatch = msg.match(/retry in ([\d.]+)ms/i);
  if (msMatch) return Math.ceil(parseFloat(msMatch[1]));
  return 0;
}

export async function analyzeAdAndPage(
  elements: ScopedElement[],
  imagePart: Part,
  maxRetries = 2
): Promise<string> {
  const model = getModel();
  const textPart: Part = {
    text: `LANDING PAGE ELEMENTS TO POTENTIALLY MODIFY:\n${JSON.stringify(elements)}\n\nReturn your personalization suggestions as JSON only.`,
  };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContentStream([imagePart, textPart]);
      let text = "";
      for await (const chunk of result.stream) {
        text += chunk.text();
      }
      return text;
    } catch (err) {
      if (!is429(err) || attempt === maxRetries) throw err;

      // Daily quota exhausted — retrying won't help
      if (isDailyQuotaExceeded(err)) {
        throw new Error(
          "Free tier daily request limit reached. Try again tomorrow or upgrade your Gemini API plan."
        );
      }

      // Per-minute rate limit — wait then retry
      const delayMs = parseRetryDelayMs(err) || Math.min(5_000 * 2 ** attempt, 30_000);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error("analyzeAdAndPage: exceeded max retries");
}
