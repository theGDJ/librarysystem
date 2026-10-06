"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Wordmark, PageHeader } from "@/components/ui";
import { useLocale } from "@/lib/locale-context";
import { tx } from "@/lib/i18n";

const NAV = [
  { href: "/assistant", label: "Assistant" },
  { href: "/finder", label: "Product finder" },
  { href: "/standards", label: "Standards" },
  { href: "/labs", label: "Laboratories" },
  { href: "/certification", label: "Certification" },
  { href: "/consumer", label: "Verify a mark" },
  { href: "/dashboard", label: "Insights" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function Nav() {
  const pathname = usePathname();
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /* close the mobile menu after navigating (derived during render, no effect) */
  if (open && openedAt !== pathname) {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header data-site-header className="sticky top-0 z-40 border-b border-rule bg-canvas">
      <div className="mx-auto flex h-[var(--header-h)] max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8">
        <Wordmark />
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {NAV.map((n) => {
              const active = isActive(pathname, n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      active ? "text-ink" : "text-muted hover:text-ink"
                    }`}
                  >
                    {tx(locale, n.label)}
                    {active && (
                      <span aria-hidden="true" className="absolute inset-x-3 -bottom-[13px] h-[2px] bg-select" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <button
          type="button"
          onClick={() => setLocale(locale === "en" ? "hi" : "en")}
          aria-label={tx(locale, "Switch language")}
          className="btn btn-secondary btn-sm shrink-0"
        >
          {locale === "en" ? "हिन्दी" : "English"}
        </button>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            setOpenedAt(pathname);
            setOpen((o) => !o);
          }}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="btn btn-quiet -mr-2 lg:hidden"
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          <span className="text-sm">{tx(locale, "Menu")}</span>
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Primary" className="border-t border-rule bg-canvas lg:hidden">
          <ul className="mx-auto max-w-[1240px] px-3 py-2 sm:px-6">
            {NAV.map((n) => {
              const active = isActive(pathname, n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between rounded-md px-3 py-3 text-base ${
                      active ? "bg-select-soft font-semibold text-select-ink" : "text-ink"
                    }`}
                  >
                    {tx(locale, n.label)}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mx-auto max-w-[1240px] px-3 pb-3 sm:px-6">
            <button
              type="button"
              onClick={() => setLocale(locale === "en" ? "hi" : "en")}
              aria-label={tx(locale, "Switch language")}
              className="btn btn-secondary btn-sm"
            >
              {locale === "en" ? "हिन्दी" : "English"}
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  const { locale } = useLocale();
  return (
    <footer data-site-footer className="mt-24 border-t border-rule bg-sunken">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-12">
        <div className="md:col-span-4">
          <Wordmark />
          <p className="mt-4 max-w-[38ch] text-sm text-muted">
            {tx(locale, "Applicable Indian Standards, certification routes, testing laboratories and mark verification — answered from a structured catalogue, with the record shown alongside every answer.")}
          </p>
        </div>
        <nav aria-label="Tools" className="md:col-span-2">
          <p className="text-sm font-semibold text-ink">{tx(locale, "Tools")}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="text-muted hover:text-ink">
                  {tx(locale, n.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-3">
          <p className="text-sm font-semibold text-ink">{tx(locale, "Legal references")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>Bureau of Indian Standards Act, 2016</li>
            <li>BIS (Conformity Assessment) Regulations, 2018</li>
            <li>
              <a href="https://www.bis.gov.in/" target="_blank" rel="noreferrer" className="link font-normal text-muted">
                bis.gov.in
              </a>
            </li>
            <li>Consumer helpline 1915 · BIS Care app</li>
          </ul>
        </div>
        <div className="md:col-span-3">
          <p className="text-sm font-semibold text-ink">{tx(locale, "About this catalogue")}</p>
          <p className="mt-3 text-sm text-muted">
            {tx(locale, "A curated demonstration knowledge base for Indian Standards and BIS services. Laboratory contacts and the licence registry are illustrative. Confirm legal positions on the official BIS portal before relying on them.")}
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Standard frame for inner pages: header with title, then content. */
export function PageShell({
  title,
  description,
  aside,
  children,
}: {
  title: string;
  description?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main id="main">
      <PageHeader title={title} description={description} aside={aside} />
      <div className="mx-auto max-w-[1240px] px-5 pt-8 sm:px-8">{children}</div>
    </main>
  );
}
