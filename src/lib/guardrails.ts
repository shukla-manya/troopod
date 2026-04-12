import type { Modification, RejectedModification } from "./validators";

const TEXT_LIMITS: Record<string, number> = {
  h1: 80,
  h2: 100,
  h3: 120,
  p: 300,
  button: 40,
  a: 40,
  meta: 160,
};

const PLACEHOLDER_RE = /\[INSERT|{.*?}|TODO|PLACEHOLDER|\[YOUR/i;

export function applyContentGuardrails(mods: Modification[]): {
  valid: Modification[];
  rejected: RejectedModification[];
} {
  const valid: Modification[] = [];
  const rejected: RejectedModification[] = [];

  for (const mod of mods) {
    if (!mod.suggestedText.trim()) {
      rejected.push({ ...mod, reason: "Suggested text is empty" });
      continue;
    }

    if (mod.suggestedText.trim() === mod.originalText.trim()) {
      rejected.push({ ...mod, reason: "Suggested text is identical to original — no change needed" });
      continue;
    }

    if (PLACEHOLDER_RE.test(mod.suggestedText)) {
      rejected.push({ ...mod, reason: "Suggested text contains unfilled placeholders" });
      continue;
    }

    const limit = TEXT_LIMITS[mod.tag] ?? 200;
    if (mod.suggestedText.length > limit) {
      rejected.push({
        ...mod,
        reason: `Suggested text exceeds ${limit} character limit for <${mod.tag}> elements`,
      });
      continue;
    }

    if (mod.suggestedText.length > mod.originalText.length * 3) {
      rejected.push({ ...mod, reason: "Suggested text is more than 3× the length of the original" });
      continue;
    }

    valid.push(mod);
  }

  return { valid, rejected };
}

export function applyConfidenceFilter(mods: Modification[]): Modification[] {
  const highOrMedium = mods.filter((m) => m.confidence !== "low");
  if (highOrMedium.length >= 2) return highOrMedium;
  return mods;
}
