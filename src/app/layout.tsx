import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Troopod — AI Landing Page Personalization",
  description: "Personalize landing pages to match your ad creative using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <main className="flex-1 w-full min-h-0">{children}</main>
        <footer className="w-full shrink-0 border-t border-gray-200/80 bg-slate-50/90 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 py-5 text-center text-sm text-gray-600 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>
              Made with love{" "}
              <span className="text-rose-500" aria-hidden>
                ♥
              </span>{" "}
              by{" "}
              <span className="font-medium text-gray-800">Manya Shukla</span>
            </span>
            <span className="text-gray-300" aria-hidden>
              ·
            </span>
            <span>2026</span>
            <span className="text-gray-300" aria-hidden>
              ·
            </span>
            <a
              href="tel:+18005586588"
              className="text-indigo-600 hover:text-indigo-800 underline-offset-2 hover:underline"
            >
              800-558-6588
            </a>
            <span className="text-gray-300" aria-hidden>
              ·
            </span>
            <a
              href="https://wa.me/18005586588"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-600 hover:text-indigo-800 underline-offset-2 hover:underline"
              aria-label="WhatsApp"
            >
              WP
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
