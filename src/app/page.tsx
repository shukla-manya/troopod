"use client";

import { useState } from "react";
import FloatingBackdrop from "../components/FloatingBackdrop";
import PersonalizeForm from "../components/PersonalizeForm";
import DiffSummary from "../components/DiffSummary";
import BeforeAfterPanel from "../components/BeforeAfterPanel";
import WarningsPanel from "../components/WarningsPanel";
import type { PersonalizationResult } from "../lib/validators";

export default function Home() {
  const [result, setResult] = useState<PersonalizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleResult(r: PersonalizationResult) {
    setResult(r);
    setError(null);
    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function handleReset() {
    setResult(null);
    setError(null);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/80 to-violet-100/60">
      <FloatingBackdrop />
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-14 sm:py-20">
        <div className="text-center mb-12 sm:mb-14">
          <div className="hero-fade-up inline-flex items-center gap-2 hero-badge-shimmer text-white px-5 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <svg
              className="w-3.5 h-3.5 animate-pulse motion-reduce:animate-none"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            AI-Powered CRO
          </div>
          <h1 className="hero-fade-up hero-fade-up-delay-1 text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-4 bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 bg-clip-text text-transparent">
            Match your page to your ad
          </h1>
          <p className="hero-fade-up hero-fade-up-delay-2 text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Input an ad creative and a landing page URL. Get a personalized
            version that aligns messaging and boosts conversion.
          </p>
        </div>

        <div className="hero-fade-up hero-fade-up-delay-3 rounded-3xl border border-white/70 bg-white/75 p-8 sm:p-10 shadow-[0_24px_80px_-12px_rgba(79,70,229,0.15)] backdrop-blur-xl ring-1 ring-indigo-500/5 mb-10 transition-shadow duration-500 hover:shadow-[0_28px_90px_-12px_rgba(79,70,229,0.2)]">
          <PersonalizeForm
            onResult={handleResult}
            onError={setError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {result && (
          <div id="results" className="space-y-6 hero-fade-up">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Results
              </h2>
              <button
                onClick={handleReset}
                type="button"
                className="text-sm text-indigo-600/80 hover:text-indigo-800 transition-colors duration-300"
              >
                ← New personalization
              </button>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/80 p-6 sm:p-8 shadow-lg shadow-indigo-500/5 backdrop-blur-xl ring-1 ring-indigo-500/5">
              <DiffSummary result={result} />
            </div>

            <WarningsPanel warnings={result.warnings} />

            <div className="rounded-2xl border border-white/70 bg-white/80 p-6 sm:p-8 shadow-lg shadow-indigo-500/5 backdrop-blur-xl ring-1 ring-indigo-500/5">
              <BeforeAfterPanel
                originalHtml={result.originalHtml}
                modifiedHtml={result.modifiedHtml}
                pageUrl={result.metadata.pageUrl}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
