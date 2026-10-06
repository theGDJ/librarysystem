"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { tx } from "@/lib/i18n";

type Mode = "ask" | "identify" | "search";

const MODES: {
  id: Mode;
  label: string;
  action: string;
  placeholder: string;
  hint: string;
  examples: string[];
  to: (q: string) => string;
}[] = [
  {
    id: "ask",
    label: "Ask a question",
    action: "Ask",
    placeholder: "Is BIS certification compulsory for two-wheeler helmets?",
    hint: "Answered by the assistant, with sources listed under each answer.",
    examples: [
      "Which standard applies to TMT steel bars?",
      "How do I get an ISI licence as a micro unit?",
      "प्रेशर कुकर पर कौन-सा मानक लागू है?",
    ],
    to: (q) => (q ? `/assistant?q=${encodeURIComponent(q)}` : "/assistant"),
  },
  {
    id: "identify",
    label: "Identify a product",
    action: "Identify",
    placeholder: "PVC insulated house wiring cable",
    hint: "Maps a product description to its standards, scheme, steps and labs.",
    examples: ["Electric ceiling fan", "Packaged drinking water", "Laptop adapter"],
    to: (q) => (q ? `/finder?q=${encodeURIComponent(q)}` : "/finder"),
  },
  {
    id: "search",
    label: "Search the catalogue",
    action: "Search",
    placeholder: "IS 694, cement, helmet…",
    hint: "Searches codes, titles, keywords and summaries across the catalogue.",
    examples: ["IS 456", "Portland cement", "Toys"],
    to: (q) => (q ? `/standards?q=${encodeURIComponent(q)}` : "/standards"),
  },
];

export function HomeSearch() {
  const router = useRouter();
  const { locale } = useLocale();
  const [mode, setMode] = useState<Mode>("ask");
  const [q, setQ] = useState("");
  const inputId = useId();
  const hintId = useId();
  const m = MODES.find((x) => x.id === mode)!;

  const go = (query: string) => router.push(m.to(query.trim()));

  return (
    <div className="sheet p-2 sm:p-2.5">
      <div role="group" aria-label={tx(locale, "What do you want to do?")} className="flex flex-wrap gap-1 p-1">
        {MODES.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={mode === x.id}
            onClick={() => setMode(x.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === x.id ? "bg-select-soft text-select-ink" : "text-muted hover:text-ink"
            }`}
          >
            {tx(locale, x.label)}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-stretch"
      >
        <label htmlFor={inputId} className="sr-only">
          {m.label}
        </label>
        <input
          id={inputId}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tx(locale, m.placeholder)}
          aria-describedby={hintId}
          autoComplete="off"
          className="min-w-0 flex-1 rounded-md border border-rule bg-canvas px-4 py-3.5 text-md text-ink placeholder:text-[#8592a3] focus:border-select focus:bg-surface focus:outline-none focus:ring-[3px] focus:ring-select-soft"
        />
        <button type="submit" className="btn btn-primary btn-lg sm:h-auto">
          {tx(locale, m.action)}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </form>

      <div className="flex flex-col gap-2 px-2 pb-1.5 pt-3 sm:flex-row sm:items-baseline sm:justify-between">
        <p id={hintId} className="text-xs text-muted">
          {tx(locale, m.hint)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-rule px-2 pb-1 pt-2.5">
        <span className="mr-1 text-xs text-muted">{tx(locale, "Try")}</span>
        {m.examples.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => router.push(m.to(ex))}
            className="rounded-sm px-1.5 py-1 text-xs font-medium text-ink underline decoration-rule-strong underline-offset-[3px] hover:decoration-select"
          >
            {locale === "hi" ? tx(locale, ex) : ex}
          </button>
        ))}
      </div>
    </div>
  );
}
