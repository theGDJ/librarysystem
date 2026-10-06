"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ShieldCheck, ArrowUpRight } from "lucide-react";

const NAV = [
  { href: "/assistant", label: "Assistant" },
  { href: "/finder", label: "Finder" },
  { href: "/standards", label: "Standards" },
  { href: "/labs", label: "Labs" },
  { href: "/guide", label: "Guide" },
  { href: "/consumer", label: "Consumer" },
  { href: "/dashboard", label: "Insights" },
];

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span className="relative grid size-9 place-items-center rounded-xl border border-gold-500/50 bg-gradient-to-br from-gold-400/20 to-transparent">
        <ShieldCheck className="size-4.5 text-gold-300" strokeWidth={1.8} />
        <span className="absolute inset-0 rounded-xl bg-gold-400/10 blur-md transition-opacity group-hover:opacity-100" />
      </span>
      <span className="leading-none">
        <span className="block font-display text-[19px] font-semibold tracking-wide text-gold-200">
          PRAMAAN
        </span>
        {!compact && (
          <span className="mono mt-1 block text-[9px] uppercase tracking-[0.28em] text-ash-500">
            BIS · Standards AI
          </span>
        )}
      </span>
    </Link>
  );
}

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-ink-900/80 px-4 py-3 backdrop-blur-xl sm:px-5">
          <Wordmark />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "/");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`rounded-full px-3.5 py-2 text-[13px] transition-colors ${
                    active
                      ? "bg-gold-400/15 text-gold-200"
                      : "text-ash-400 hover:text-gold-200"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/assistant" className="btn-gold px-4 py-2 text-[13px]">
              Ask Pramaan <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="grid size-9 place-items-center rounded-xl border border-line text-ash-300 lg:hidden"
            aria-label="Menu"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
        {open && (
          <div className="mt-2 rounded-2xl border border-line bg-ink-900/95 p-2 backdrop-blur-xl lg:hidden">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`block rounded-xl px-4 py-3 text-sm ${
                  pathname === n.href ? "bg-gold-400/15 text-gold-200" : "text-ash-300"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-ink-900">
      <div className="blueprint pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-[1400px] px-6 py-14">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-5 text-sm leading-relaxed text-ash-400">
              AI-powered intelligent assistant for Indian Standards and BIS services —
              source-cited answers for industries, MSMEs and consumers.
            </p>
            <div className="mono mt-5 text-[10px] uppercase tracking-[0.24em] text-ash-500">
              Smart India Hackathon 2026
            </div>
            <div className="mono mt-2 text-[10px] uppercase tracking-[0.24em] text-ash-500">
              Ministry of Consumer Affairs, Food & Public Distribution
            </div>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <div className="kicker mb-4">Product</div>
              {NAV.slice(0, 4).map((n) => (
                <Link key={n.href} href={n.href} className="link-underline mb-2 block w-fit text-sm text-ash-400">
                  {n.label}
                </Link>
              ))}
            </div>
            <div>
              <div className="kicker mb-4">Services</div>
              {NAV.slice(4).map((n) => (
                <Link key={n.href} href={n.href} className="link-underline mb-2 block w-fit text-sm text-ash-400">
                  {n.label}
                </Link>
              ))}
            </div>
            <div>
              <div className="kicker mb-4">Key references</div>
              {["BIS Act, 2016", "Conformity Assessment Regs, 2018", "bis.gov.in", "BIS Care App · 1915"].map((x) => (
                <div key={x} className="mb-2 text-sm text-ash-500">
                  {x}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 text-[11px] text-ash-500 sm:flex-row sm:items-center">
          <span>Demonstration prototype with a curated standards knowledge base. Verify final legal positions on the official BIS portal.</span>
          <span className="mono tracking-widest">जय हिंद · BUILT FOR SIH 2026</span>
        </div>
      </div>
    </footer>
  );
}

export function PageShell({
  kicker,
  title,
  sub,
  children,
}: {
  kicker: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen pb-24 pt-36">
      <div className="blueprint pointer-events-none fixed inset-0 opacity-60" />
      <div className="glow-gold pointer-events-none fixed -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 opacity-60" />
      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="mb-10">
          <div className="kicker mb-3">{kicker}</div>
          <h1 className="font-display text-4xl font-semibold text-white sm:text-5xl">{title}</h1>
          {sub && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ash-400">{sub}</p>}
        </div>
        {children}
      </div>
    </main>
  );
}
