import Groq from "groq-sdk";
import { getGroqKey } from "./env";
import type { AdInput, ScopedElement } from "./validators";

let _client: Groq | null = null;

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

function getClient(): Groq {
  if (!_client) {
    _client = new Groq({ apiKey: getGroqKey() });
  }
  return _client;
}

async function buildImageUrl(adInput: AdInput): Promise<string> {
  if (adInput.type === "file") {
    // Already a base64 data URL — pass as-is
    return adInput.value;
  }
  // URL type: fetch and convert to base64 so Groq doesn't need to reach external hosts
  const res = await fetch(adInput.value);
  if (!res.ok) throw new Error(`Failed to fetch ad image: ${res.status}`);
  const mimeType = (res.headers.get("content-type") ?? "image/jpeg").split(";")[0];
  const buffer = await res.arrayBuffer();
  const data = Buffer.from(buffer).toString("base64");
  return `data:${mimeType};base64,${data}`;
}

function is429(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("rate_limit");
}

export async function analyzeAdAndPage(
  elements: ScopedElement[],
  adInput: AdInput,
  maxRetries = 2
): Promise<string> {
  const client = getClient();
  const imageUrl = await buildImageUrl(adInput);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        max_tokens: 2048,
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
              {
                type: "text",
                text: `LANDING PAGE ELEMENTS TO POTENTIALLY MODIFY:\n${JSON.stringify(elements)}\n\nReturn your personalization suggestions as JSON only.`,
              },
            ],
          },
        ],
      });

      return response.choices[0]?.message?.content ?? "";
    } catch (err) {
      if (!is429(err) || attempt === maxRetries) throw err;
      const delayMs = Math.min(5_000 * 2 ** attempt, 30_000);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error("analyzeAdAndPage: exceeded max retries");
}
