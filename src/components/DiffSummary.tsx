"use client";

import type { PersonalizationResult } from "../lib/validators";

type Props = {
  result: PersonalizationResult;
};

const CONFIDENCE_COLORS = {
  high: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

export default function DiffSummary({ result }: Props) {
  const { adAnalysis, summary, modifications, cro_principles_applied, metadata } = result;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">Personalization Summary</h2>
          <p className="text-sm text-gray-500 mt-0.5">{summary.headline}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-indigo-600">{metadata.modificationsApplied}</span>
          <p className="text-xs text-gray-400">changes applied</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Ad Analysis</p>
          <p className="text-sm font-medium text-gray-900">{adAnalysis.primaryMessage}</p>
          <p className="text-xs text-gray-500">Audience: {adAnalysis.targetAudience}</p>
          <p className="text-xs text-gray-500">Hook: {adAnalysis.emotionalHook}</p>
          <div className="flex flex-wrap gap-1 pt-1">
            {adAnalysis.keyTerms.map((term) => (
              <span
                key={term}
                className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs"
              >
                {term}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">CRO Principles Applied</p>
          <div className="flex flex-wrap gap-1.5">
            {cro_principles_applied.map((p) => (
              <span
                key={p}
                className="px-2 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-medium"
              >
                {p}
              </span>
            ))}
          </div>
          <ul className="mt-2 space-y-1">
            {summary.bullets.map((b, i) => (
              <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                <span className="text-indigo-400 mt-0.5">•</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {modifications.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Changes Made</p>
          <div className="space-y-2">
            {modifications.map((mod, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-mono text-xs">
                    {`<${mod.tag}>`}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONFIDENCE_COLORS[mod.confidence]}`}
                  >
                    {mod.confidence} confidence
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400 mb-1">Original</p>
                    <p className="text-gray-600 line-through">{mod.originalText}</p>
                  </div>
                  <div>
                    <p className="text-indigo-400 mb-1">Personalized</p>
                    <p className="text-gray-900 font-medium">{mod.suggestedText}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 italic">{mod.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
