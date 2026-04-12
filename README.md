# Troopod

Next.js app that scrapes a landing page, sends the page snapshot plus an ad creative to Groq, and returns AI-suggested copy changes with a before/after HTML preview.

## Folder structure

```
troopod/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/personalize/
│   │   │   └── route.ts              # POST /api/personalize — validates body, runs pipeline, returns JSON
│   │   ├── layout.tsx                # Root layout, fonts, metadata
│   │   ├── page.tsx                  # Home: form, loading, results (summary, warnings, iframes)
│   │   └── globals.css               # Tailwind import + CSS variables
│   ├── components/                   # Client UI
│   │   ├── PersonalizeForm.tsx       # Ad URL/upload + page URL, calls API
│   │   ├── DiffSummary.tsx           # Ad analysis, CRO bullets, per-change diff
│   │   ├── BeforeAfterPanel.tsx      # Side-by-side or highlighted iframe preview
│   │   └── WarningsPanel.tsx         # Collapsible list of rejected suggestions
│   ├── lib/                          # Shared server-safe logic
│   │   ├── scraper.ts                # Fetch HTML (cheerio), extract targets, apply modifications, validate selectors
│   │   ├── gemini.ts                 # Gemini: image + elements → JSON suggestion text
│   │   ├── claude.ts                 # Anthropic client (same prompt shape; not wired by default service)
│   │   ├── validators.ts             # Zod request/response schemas and TypeScript types
│   │   ├── guardrails.ts             # Filters unsafe or low-value AI output
│   │   └── env.ts                    # Reads API keys from environment
│   └── services/
│       └── personalization-service.ts # Orchestrates scrape → AI → validate → guardrails → patched HTML
├── next.config.ts                    # e.g. serverExternalPackages for cheerio
├── vercel.json                       # Deployment config
├── postcss.config.mjs                # Tailwind PostCSS
├── package.json
└── tsconfig.json
```

## Run locally

```bash
npm install
npm run dev
```

