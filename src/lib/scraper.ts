import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import type { Element } from "domhandler";
import type { ScopedElement, Modification } from "./validators";

const SCOPED_SELECTORS: Array<{ tag: ScopedElement["tag"]; query: string }> = [
  { tag: "h1", query: "h1" },
  { tag: "h2", query: "h2" },
  { tag: "h3", query: "h3" },
  {
    tag: "p",
    query:
      "section p, header p, .hero p, [class*='hero'] p, [class*='lead'] p, [class*='subtitle'] p",
  },
  { tag: "button", query: "button, [role='button'], input[type='submit']" },
  {
    tag: "a",
    query: "a.btn, a.button, a[class*='cta'], a[class*='btn']",
  },
  { tag: "meta", query: "meta[name='description']" },
];

const MAX_ELEMENTS = 15;

export class ScrapingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScrapingError";
  }
}

function buildSelector($: CheerioAPI, el: Element, tag: string): string {
  const jqEl = $(el);
  const id = jqEl.attr("id");
  if (id) return `${tag}#${id}`;

  const classAttr = jqEl.attr("class");
  const firstClass = classAttr?.trim().split(/\s+/)[0];
  const parent = el.parent;
  if (!parent) return tag;

  const siblings = $(parent).children(tag);
  const index = siblings.index(el) + 1;

  if (firstClass) return `${tag}.${firstClass}:nth-of-type(${index})`;
  return `${tag}:nth-of-type(${index})`;
}

export async function fetchPage(url: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TroopodBot/1.0; +https://troopod.app)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new ScrapingError("Could not reach the page — check the URL or try again");
  }

  if (!res.ok) {
    throw new ScrapingError(
      `Page returned HTTP ${res.status}. It may be blocking automated access.`
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    throw new ScrapingError("URL did not return an HTML page");
  }

  return res.text();
}

export function extractScopedElements(html: string): {
  $: CheerioAPI;
  elements: ScopedElement[];
} {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const elements: ScopedElement[] = [];

  for (const { tag, query } of SCOPED_SELECTORS) {
    if (elements.length >= MAX_ELEMENTS) break;

    if (tag === "meta") {
      const el = $("meta[name='description']").first();
      if (el.length) {
        const text = el.attr("content") ?? "";
        if (text && !seen.has(text)) {
          seen.add(text);
          elements.push({ selector: "meta[name='description']", tag, originalText: text });
        }
      }
      continue;
    }

    $(query).each((_, node) => {
      if (elements.length >= MAX_ELEMENTS) return false;
      const el = node as Element;
      const text = $(el).clone().children().remove().end().text().trim();
      if (!text || seen.has(text)) return;
      seen.add(text);
      const selector = buildSelector($, el, tag);
      elements.push({ selector, tag, originalText: text });
    });
  }

  return { $, elements };
}

function tokenOverlap(a: string, b: string): number {
  const tokensA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const tokensB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let shared = 0;
  for (const t of tokensA) if (tokensB.has(t)) shared++;
  return shared / Math.max(tokensA.size, tokensB.size);
}

export function applyModifications(
  html: string,
  mods: Modification[]
): string {
  const $ = cheerio.load(html);

  for (const mod of mods) {
    if (mod.tag === "meta") {
      $("meta[name='description']").attr("content", mod.suggestedText);
      continue;
    }

    const el = $(mod.selector).first();
    if (!el.length) continue;

    const textNodes = el.contents().filter((_, n) => n.type === "text");
    if (textNodes.length > 0) {
      textNodes.first().replaceWith(mod.suggestedText);
    } else {
      el.prepend(mod.suggestedText);
    }

    el.attr("data-troopod-modified", "true");
  }

  return $.html();
}

export function validateSelectorsExist(
  html: string,
  mods: Modification[]
): { valid: Modification[]; rejected: Array<Modification & { reason: string }> } {
  const $ = cheerio.load(html);
  const valid: Modification[] = [];
  const rejected: Array<Modification & { reason: string }> = [];

  for (const mod of mods) {
    if (mod.tag === "meta") {
      const el = $("meta[name='description']");
      if (!el.length) {
        rejected.push({ ...mod, reason: "No meta description found on this page" });
        continue;
      }
      const actualText = el.attr("content") ?? "";
      if (tokenOverlap(actualText, mod.originalText) < 0.4) {
        rejected.push({ ...mod, reason: "Original text does not match actual page content" });
        continue;
      }
      valid.push(mod);
      continue;
    }

    const el = $(mod.selector).first();
    if (!el.length) {
      rejected.push({ ...mod, reason: `Selector "${mod.selector}" not found in page DOM` });
      continue;
    }

    const actualText = el.text().trim();
    if (tokenOverlap(actualText, mod.originalText) < 0.4) {
      rejected.push({ ...mod, reason: "Original text does not match actual page content" });
      continue;
    }

    valid.push(mod);
  }

  return { valid, rejected };
}
