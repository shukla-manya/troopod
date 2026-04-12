import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicKey } from "./env";
import type { AdInput, ScopedElement } from "./validators";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: getAnthropicKey() });
  }
  return _client;
}

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

function buildImageContent(adInput: AdInput): Anthropic.ImageBlockParam {
  if (adInput.type === "url") {
    return {
      type: "image",
      source: { type: "url", url: adInput.value },
    };
  }
  const [header, data] = adInput.value.split(",");
  const mediaType = header.replace("data:", "").replace(";base64", "") as
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp";
  return {
    type: "image",
    source: { type: "base64", media_type: mediaType, data },
  };
}

export async function analyzeAdAndPage(
  elements: ScopedElement[],
  adInput: AdInput
): Promise<string> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    temperature: 0.2,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          buildImageContent(adInput),
          {
            type: "text",
            text: `LANDING PAGE ELEMENTS TO POTENTIALLY MODIFY:\n${JSON.stringify(elements, null, 2)}\n\nReturn your personalization suggestions as JSON only.`,
          },
        ],
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Claude returned no text content");
  }
  return block.text;
}
