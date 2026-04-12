"use client";

import { useState } from "react";

type Props = {
  warnings: string[];
};

export default function WarningsPanel({ warnings }: Props) {
  const [open, setOpen] = useState(false);

  if (warnings.length === 0) return null;

  return (
    <div className="border border-amber-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
      >
        <span>
          {warnings.length} suggestion{warnings.length > 1 ? "s" : ""} not applied
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 py-3 space-y-2 bg-white">
          <p className="text-xs text-gray-400 mb-2">What we didn&apos;t change and why:</p>
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-gray-600 flex gap-2">
              <span className="text-amber-400 flex-shrink-0">—</span>
              {w}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
