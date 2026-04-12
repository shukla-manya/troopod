"use client";

import { useState } from "react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            AI-Powered CRO
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Match your page to your ad
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Input an ad creative and a landing page URL. Get a personalized version that aligns messaging and boosts conversion.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
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
          <div id="results" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Results</h2>
              <button
                onClick={handleReset}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← New personalization
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <DiffSummary result={result} />
            </div>

            <WarningsPanel warnings={result.warnings} />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
