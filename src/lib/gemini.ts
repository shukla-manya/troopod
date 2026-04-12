import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { getGeminiKey } from "./env";
import type { AdInput, ScopedElement } from "./validators";

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

async function buildImagePart(adInput: AdInput): Promise<Part> {
  if (adInput.type === "file") {
    const [header, data] = adInput.value.split(",");
    const mimeType = header.replace("data:", "").replace(";base64", "") as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";
    return { inlineData: { mimeType, data } };
  }

  // Fetch external URL and convert to inline base64
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

export async function analyzeAdAndPage(
  elements: ScopedElement[],
  adInput: AdInput
): Promise<string> {
  const model = getModel();
  const imagePart = await buildImagePart(adInput);
  const textPart: Part = {
    text: `LANDING PAGE ELEMENTS TO POTENTIALLY MODIFY:\n${JSON.stringify(elements, null, 2)}\n\nReturn your personalization suggestions as JSON only.`,
  };

  const result = await model.generateContent([imagePart, textPart]);
  return result.response.text();
}
