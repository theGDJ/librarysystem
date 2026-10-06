import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "PRAMAAN — AI Assistant for Indian Standards & BIS Services",
  description:
    "AI-powered intelligent assistant for Indian Standards and BIS services — find applicable standards, certification schemes, hallmarking guidance, testing labs and consumer verification.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${grotesk.variable} ${jetbrains.variable}`}>
      <body className="bg-ink-950 font-ui text-slate-200 antialiased">{children}</body>
    </html>
  );
}
