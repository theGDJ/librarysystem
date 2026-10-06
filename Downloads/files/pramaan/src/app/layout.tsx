import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { LocaleProvider } from "@/lib/locale-context";
import { getLocale } from "@/lib/server-locale";
import { RouteScrollManager } from "@/components/RouteScrollManager";
/* fonts are self-hosted (bundled from npm via @fontsource-variable) so the
 * app builds and renders identically with or without internet access.
 * Manrope — headings · Inter — interface and reading text ·
 * Noto Sans Devanagari — Hindi answers · JetBrains Mono — IS codes only */
import "@fontsource-variable/manrope";
import "@fontsource-variable/inter";
import "@fontsource-variable/noto-sans-devanagari";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Pramaan — Indian Standards and BIS compliance, with sources",
    template: "%s | Pramaan",
  },
  description:
    "Describe a product and find the Indian Standards that apply, whether a Quality Control Order makes certification compulsory, the BIS scheme to follow and the laboratories that test it — each linked to its catalogue record.",
};

export const viewport: Viewport = {
  themeColor: "#faf9f6",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className="min-h-screen bg-canvas text-body antialiased">
        <LocaleProvider initialLocale={locale}>
          <RouteScrollManager />
          <a href="#main" className="skip-link">
            {locale === "hi" ? "मुख्य सामग्री पर जाएँ" : "Skip to content"}
          </a>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
