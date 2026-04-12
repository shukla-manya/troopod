import { analyzeAdAndPage, buildImagePart, type Part } from "../lib/gemini";
import {
  fetchPage,
  extractScopedElements,
  applyModifications,
  validateSelectorsExist,
  ScrapingError,
} from "../lib/scraper";
import { applyContentGuardrails, applyConfidenceFilter } from "../lib/guardrails";
import { PersonalizationResponseSchema } from "../lib/validators";
import type { PersonalizeRequest, PersonalizationResult, RejectedModification } from "../lib/validators";

export class AIValidationError extends Error {
  raw: string;
  constructor(message: string, raw: string) {
    super(message);
    this.name = "AIValidationError";
    this.raw = raw;
  }
}

export { ScrapingError };

async function callGeminiWithRetry(
  elements: ReturnType<typeof extractScopedElements>["elements"],
  imagePart: Part,
  attempt: number = 0
): Promise<ReturnType<typeof PersonalizationResponseSchema.parse>> {
  const rawText = await analyzeAdAndPage(elements, imagePart);

  let parsed: unknown;
  try {
    const cleaned = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    parsed = JSON.parse(cleaned);
  } catch {
    if (attempt < 1) return callGeminiWithRetry(elements, imagePart, attempt + 1);
    throw new AIValidationError("Gemini returned invalid JSON", rawText);
  }

  const result = PersonalizationResponseSchema.safeParse(parsed);
  if (!result.success) {
    if (attempt < 1) return callGeminiWithRetry(elements, imagePart, attempt + 1);
    throw new AIValidationError(`Gemini output schema mismatch: ${result.error.message}`, rawText);
  }

  return result.data;
}

export async function runPersonalization(
  req: PersonalizeRequest
): Promise<PersonalizationResult> {
  const [rawHtml, imagePart] = await Promise.all([
    fetchPage(req.pageUrl),
    buildImagePart(req.adInput),
  ]);

  const { elements } = extractScopedElements(rawHtml);

  if (elements.length === 0) {
    throw new ScrapingError(
      "No modifiable elements found. The page may be JavaScript-rendered (SPA). Try a different URL."
    );
  }

  const aiOutput = await callGeminiWithRetry(elements, imagePart);

  const { valid: domValid, rejected: domRejected } = validateSelectorsExist(
    rawHtml,
    aiOutput.modifications
  );

  const { valid: contentValid, rejected: contentRejected } = applyContentGuardrails(domValid);

  const finalMods = applyConfidenceFilter(contentValid);

  const allRejected: RejectedModification[] = [...domRejected, ...contentRejected];

  const modifiedHtml = applyModifications(rawHtml, finalMods);

  return {
    originalHtml: rawHtml,
    modifiedHtml,
    modifications: finalMods,
    adAnalysis: aiOutput.adAnalysis,
    summary: aiOutput.summary,
    cro_principles_applied: aiOutput.cro_principles_applied,
    warnings: allRejected.map(
      (r) => `[${r.selector}] ${r.reason}`
    ),
    metadata: {
      pageUrl: req.pageUrl,
      elementsScraped: elements.length,
      modificationsApplied: finalMods.length,
      modificationsRejected: allRejected.length,
    },
  };
}
