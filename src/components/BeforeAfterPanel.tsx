"use client";

import { useState } from "react";

type Props = {
  originalHtml: string;
  modifiedHtml: string;
  pageUrl: string;
};

const HIGHLIGHT_STYLE = `<style>
[data-troopod-modified]{
  outline:3px solid #f59e0b !important;
  outline-offset:3px;
  background:rgba(245,158,11,0.08) !important;
}
</style>`;

function buildSrcdoc(html: string, baseUrl: string, highlight: boolean): string {
  const withBase = html.replace(/<head([^>]*)>/i, `<head$1><base href="${baseUrl}">`);
  if (!highlight) return withBase;
  return withBase.replace(/<\/head>/i, `${HIGHLIGHT_STYLE}</head>`);
}

export default function BeforeAfterPanel({ originalHtml, modifiedHtml, pageUrl }: Props) {
  const [view, setView] = useState<"split" | "highlight">("split");

  const tabs = [
    { id: "split", label: "Side by Side" },
    { id: "highlight", label: "Highlights" },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Page Comparison</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === t.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {view === "split" ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Original</p>
            <iframe
              srcDoc={buildSrcdoc(originalHtml, pageUrl, false)}
              className="w-full h-[600px] rounded-xl border border-gray-200 bg-white"
              sandbox="allow-same-origin"
              title="Original page"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Personalized</p>
            <iframe
              srcDoc={buildSrcdoc(modifiedHtml, pageUrl, false)}
              className="w-full h-[600px] rounded-xl border border-indigo-200 bg-white"
              sandbox="allow-same-origin"
              title="Personalized page"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            Modified elements are highlighted in amber.
          </p>
          <iframe
            srcDoc={buildSrcdoc(modifiedHtml, pageUrl, true)}
            className="w-full h-[700px] rounded-xl border border-gray-200 bg-white"
            sandbox="allow-same-origin"
            title="Personalized page with highlights"
          />
        </div>
      )}
    </div>
  );
}
