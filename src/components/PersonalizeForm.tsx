"use client";

import { useState, useRef } from "react";
import type { PersonalizationResult } from "../lib/validators";

type Props = {
  onResult: (result: PersonalizationResult) => void;
  onError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
};

const STEPS = ["Fetching page...", "Analyzing ad creative...", "Applying personalization..."];

export default function PersonalizeForm({ onResult, onError, isLoading, setIsLoading }: Props) {
  const [adType, setAdType] = useState<"url" | "file">("url");
  const [adUrl, setAdUrl] = useState("");
  const [adBase64, setAdBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setAdBase64(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;

    try {
      new URL(pageUrl);
    } catch {
      onError("Please enter a valid landing page URL (including https://)");
      return;
    }

    if (adType === "url") {
      try {
        new URL(adUrl);
      } catch {
        onError("Please enter a valid ad image URL");
        return;
      }
    } else if (!adBase64) {
      onError("Please upload an ad image");
      return;
    }

    setIsLoading(true);
    setStepIndex(0);

    const stepTimer = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 3000);

    try {
      const body = {
        pageUrl,
        adInput:
          adType === "url"
            ? { type: "url", value: adUrl }
            : { type: "file", value: adBase64 },
      };

      const res = await fetch("/api/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong");
      }
      onResult(data as PersonalizationResult);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Request failed");
    } finally {
      clearInterval(stepTimer);
      setIsLoading(false);
      setStepIndex(0);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ad Creative</label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setAdType("url")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              adType === "url"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Image URL
          </button>
          <button
            type="button"
            onClick={() => setAdType("file")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              adType === "file"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Upload File
          </button>
        </div>

        {adType === "url" ? (
          <input
            type="url"
            value={adUrl}
            onChange={(e) => setAdUrl(e.target.value)}
            placeholder="https://example.com/ad-banner.jpg"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            required
          />
        ) : (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
            >
              {fileName ? fileName : "Click to upload image (JPG, PNG, WebP)"}
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Landing Page URL</label>
        <input
          type="url"
          value={pageUrl}
          onChange={(e) => setPageUrl(e.target.value)}
          placeholder="https://yoursite.com/landing"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? STEPS[stepIndex] : "Personalize Landing Page"}
      </button>
    </form>
  );
}
