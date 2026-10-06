"use client";

/* Shared presentational primitives read the active app language. */
import Link from "next/link";
import type { ReactNode } from "react";
import { AlertCircle, Database, Quote, PenLine, Loader2 } from "lucide-react";
import { standardHref } from "@/lib/format";
import { useLocale } from "@/lib/locale-context";
import { tx } from "@/lib/i18n";

/* ---------------------------------------------------------------- mark */

/** Three lines of a document; the last, shorter line is the cited one. */
export function Mark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <rect width="24" height="24" rx="5" fill="#102A4C" />
      <path d="M6.5 7.5h11M6.5 11.5h11" stroke="#FAF9F6" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6.5 15.5h7" stroke="#5FB3B3" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark() {
  const { locale } = useLocale();
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-sm" aria-label={tx(locale, "Pramaan home")}>
      <Mark />
      <span className="font-heading text-[17px] font-bold tracking-[-0.02em] text-ink">Pramaan</span>
    </Link>
  );
}

/* ------------------------------------------------------- identifiers */

/** An IS code rendered as an identifier, linked to its reference page. */
export function StandardCode({
  code,
  link = true,
  className = "",
}: {
  code: string;
  link?: boolean;
  className?: string;
}) {
  if (!link) return <span className={`id ${className}`}>{code}</span>;
  return (
    <Link
      href={standardHref(code)}
      className={`id underline decoration-rule-strong underline-offset-[3px] hover:decoration-select ${className}`}
    >
      {code}
    </Link>
  );
}

/** Compulsory vs voluntary — the single most important fact about a standard. */
export function ObligationTag({ mandatory, long = false }: { mandatory: boolean; long?: boolean }) {
  const { locale } = useLocale();
  return mandatory ? (
    <span className="tag tag-qco" title={tx(locale, "A Quality Control Order makes certification compulsory")}>
      {tx(locale, long ? "Compulsory under a QCO" : "QCO")}
    </span>
  ) : (
    <span className="tag">{tx(locale, long ? "Voluntary certification" : "Voluntary")}</span>
  );
}

/* ------------------------------------------------------ evidence tiers */

type Tier = "record" | "extract" | "model";

const TIER: Record<Tier, { icon: typeof Database; text: string; cls: string }> = {
  record: { icon: Database, text: "Catalogue record", cls: "text-ink" },
  extract: { icon: Quote, text: "Knowledge-base extract", cls: "text-select-ink" },
  model: { icon: PenLine, text: "Model summary", cls: "text-muted" },
};

export function TierLabel({ tier, note }: { tier: Tier; note?: string }) {
  const { locale } = useLocale();
  const t = TIER[tier];
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={`inline-flex items-center gap-1.5 text-2xs font-semibold ${t.cls}`}>
        <t.icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
        {tx(locale, t.text)}
      </span>
      {note && <span className="text-2xs text-muted">{tx(locale, note)}</span>}
    </div>
  );
}

/* ---------------------------------------------------------- page frame */

export function PageHeader({
  title,
  description,
  aside,
}: {
  title: string;
  description?: ReactNode;
  aside?: ReactNode;
}) {
  const { locale } = useLocale();
  return (
    <div className="border-b border-rule">
      <div className="mx-auto grid max-w-[1240px] gap-6 px-5 pb-8 pt-10 sm:px-8 sm:pt-14 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <h1 className="text-2xl font-bold tracking-[-0.025em] sm:text-3xl">{tx(locale, title)}</h1>
          {description && <p className="mt-3 max-w-[62ch] text-md text-muted">{typeof description === "string" ? tx(locale, description) : description}</p>}
        </div>
        {aside && <div className="lg:col-span-4 lg:justify-self-end">{aside}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- states */

export function Spinner({ label }: { label: string }) {
  const { locale } = useLocale();
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-muted">
      <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      {tx(locale, label)}
    </span>
  );
}

export function Notice({
  tone = "neutral",
  title,
  children,
  action,
}: {
  tone?: "neutral" | "danger" | "attention";
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const { locale } = useLocale();
  const toneCls =
    tone === "danger"
      ? "border-danger/30 bg-danger-soft"
      : tone === "attention"
        ? "border-attention/40 bg-attention-soft"
        : "border-rule bg-sunken";
  return (
    <div role={tone === "danger" ? "alert" : undefined} className={`rounded-md border px-4 py-3.5 ${toneCls}`}>
      <div className="flex gap-3">
        <AlertCircle
          className={`mt-0.5 size-4 shrink-0 ${tone === "danger" ? "text-danger" : tone === "attention" ? "text-attention-ink" : "text-muted"}`}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{tx(locale, title)}</p>
          {children && <div className="mt-1 text-sm text-body">{children}</div>}
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  );
}

/** Empty state — an invitation to act, not a mood. */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  const { locale } = useLocale();
  return (
    <div className="rounded-lg border border-dashed border-rule-strong px-6 py-10">
      <p className="font-heading text-md font-semibold text-ink">{tx(locale, title)}</p>
      {children && <div className="mt-2 max-w-[60ch] text-sm text-muted">{children}</div>}
    </div>
  );
}

/** Definition-list row used for metadata blocks. */
export function Meta({ term, children }: { term: string; children: ReactNode }) {
  const { locale } = useLocale();
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 border-t border-rule py-2.5 text-sm first:border-t-0">
      <dt className="text-muted">{tx(locale, term)}</dt>
      <dd className="min-w-0 text-ink">{children}</dd>
    </div>
  );
}
