import { z } from "zod";

export const AdInputSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("url"), value: z.string().url() }),
  z.object({
    type: z.literal("file"),
    value: z.string().refine((s) => s.startsWith("data:image/"), "Must be a base64 image data URI"),
  }),
]);

export const PersonalizeRequestSchema = z.object({
  pageUrl: z.string().url(),
  adInput: AdInputSchema,
});

export const ModificationSchema = z.object({
  selector: z.string().min(1).max(200),
  tag: z.enum(["h1", "h2", "h3", "p", "button", "a", "meta"]),
  originalText: z.string().min(1).max(2000),
  suggestedText: z.string().min(1).max(500),
  reasoning: z.string().min(1).max(300),
  confidence: z.enum(["high", "medium", "low"]),
});

export const PersonalizationResponseSchema = z.object({
  adAnalysis: z.object({
    primaryMessage: z.string(),
    targetAudience: z.string(),
    emotionalHook: z.string(),
    keyTerms: z.array(z.string()).min(1).max(10),
  }),
  modifications: z.array(ModificationSchema).max(10),
  summary: z.object({
    headline: z.string().min(1).max(200),
    bullets: z.array(z.string()).min(1).max(6),
  }),
  cro_principles_applied: z.array(z.string()).min(1),
});

export type AdInput = z.infer<typeof AdInputSchema>;
export type PersonalizeRequest = z.infer<typeof PersonalizeRequestSchema>;
export type Modification = z.infer<typeof ModificationSchema>;
export type PersonalizationResponse = z.infer<typeof PersonalizationResponseSchema>;

export type ScopedElement = {
  selector: string;
  tag: "h1" | "h2" | "h3" | "p" | "button" | "a" | "meta";
  originalText: string;
};

export type RejectedModification = Modification & { reason: string };

export type PersonalizationResult = {
  originalHtml: string;
  modifiedHtml: string;
  modifications: Modification[];
  adAnalysis: PersonalizationResponse["adAnalysis"];
  summary: PersonalizationResponse["summary"];
  cro_principles_applied: string[];
  warnings: string[];
  metadata: {
    pageUrl: string;
    elementsScraped: number;
    modificationsApplied: number;
    modificationsRejected: number;
  };
};
