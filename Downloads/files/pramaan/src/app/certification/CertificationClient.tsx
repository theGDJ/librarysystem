"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, ChevronDown, Printer } from "lucide-react";
import { COMPARISON, FAQS, INDICATIVE_NOTE, READINESS, SCHEMES } from "./data";
import { useLocale } from "@/lib/locale-context";
import { tx } from "@/lib/i18n";

export type CertStats = {
  standards: number;
  mandatory: number;
  labs: number;
  ahc: number;
  schemes: { scheme: string; count: number }[];
  qcos: { qco: string; count: number }[];
};

const STORAGE_KEY = "pramaan_cert_checklist";
const CHECKLIST_EVENT = "pramaan-checklist";

/* Document-checklist state lives in localStorage and is exposed through
 * useSyncExternalStore so no effect has to call setState after mount. */
let cacheRaw: string | null = null;
let cacheVal: Record<string, boolean> = {};
function readChecklist(): Record<string, boolean> {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cacheVal;
  }
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      cacheVal = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      cacheVal = {};
    }
  }
  return cacheVal;
}
const EMPTY_CHECKLIST: Record<string, boolean> = {};
function subscribeChecklist(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CHECKLIST_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHECKLIST_EVENT, cb);
  };
}
function writeChecklist(next: Record<string, boolean>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new Event(CHECKLIST_EVENT));
}

const PERSONAS = [
  { id: "manufacturer", label: "Indian manufacturer" },
  { id: "importer", label: "Importer or brand owner" },
  { id: "foreign", label: "Foreign manufacturer" },
  { id: "jeweller", label: "Jeweller or retailer" },
  { id: "consumer", label: "Consumer or buyer" },
];

const AREAS = [
  { id: "construction", label: "Construction and steel" },
  { id: "electronics", label: "Electricals and electronics" },
  { id: "food", label: "Food, water and agriculture" },
  { id: "consumer", label: "Consumer goods and toys" },
  { id: "jewellery", label: "Gold and silver jewellery" },
  { id: "machinery", label: "Machinery and engineering" },
];

function recommend(persona: string, area: string) {
  if (persona === "jeweller" || area === "jewellery")
    return {
      id: "hallmark",
      why: "Jewellery is certified by fineness at a BIS-recognized Assaying and Hallmarking Centre, not by a factory licence. Gold hallmarking is mandatory in notified districts and every article gets a unique HUID.",
    };
  if (persona === "foreign")
    return {
      id: "fmcs",
      why: "Products made outside India are licensed under FMCS against the overseas factory, with an Authorized Indian Representative and a BIS audit abroad. Goods must be certified before they are imported.",
    };
  if (area === "electronics" && persona !== "consumer")
    return {
      id: "crs",
      why: "Most electricals, electronics and IT goods are notified under the Compulsory Registration Scheme: a model is tested at a recognized lab, registered online, then marked with the R-number. There is no factory audit.",
    };
  if (persona === "consumer")
    return {
      id: "eco",
      why: "For a buyer, the useful part of the system is verification: match the CM/L- or R- number (or the HUID on jewellery) with the official BIS registry, and prefer voluntarily certified products where no QCO applies.",
    };
  return {
    id: "isi",
    why: "Products made in India with an applicable Indian Standard follow Scheme-I: application, factory audit, independent testing and an ISI licence with a CM/L- number. Certification is compulsory wherever a QCO applies.",
  };
}

function ChoiceGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const id = label.replace(/\W+/g, "-").toLowerCase();
  return (
    <div>
      <p id={id} className="text-sm font-semibold text-ink">
        {label}
      </p>
      <div role="group" aria-labelledby={id} className="mt-2 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)} className="choice">
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-xl font-bold tracking-[-0.02em]">
      {children}
    </h2>
  );
}

export function CertificationClient({ stats }: { stats: CertStats }) {
  const { locale } = useLocale();
  const params = useSearchParams();
  const initial = params.get("scheme");
  const [active, setActive] = useState(SCHEMES.some((s) => s.id === initial) ? (initial as string) : "isi");
  const [persona, setPersona] = useState("manufacturer");
  const [area, setArea] = useState("construction");
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const checked = useSyncExternalStore(subscribeChecklist, readChecklist, () => EMPTY_CHECKLIST);

  const scheme = SCHEMES.find((s) => s.id === active)!;
  const recommendation = useMemo(() => {
    const r = recommend(persona, area);
    return { ...r, scheme: SCHEMES.find((s) => s.id === r.id)! };
  }, [persona, area]);

  const matches = useMemo(() => {
    const ids = new Set<string>();
    for (const item of READINESS) if (answers[item.id]) item.schemes.forEach((s) => ids.add(s));
    return SCHEMES.filter((s) => ids.has(s.id));
  }, [answers]);

  const answered = READINESS.filter((r) => answers[r.id]).length;
  const doneDocs = scheme.documents.filter((d) => checked[`${scheme.id}:${d}`]).length;
  const pct = Math.round((doneDocs / scheme.documents.length) * 100);

  const openScheme = (id: string) => {
    setActive(id);
    requestAnimationFrame(() => document.getElementById("walkthrough")?.scrollIntoView({ block: "start" }));
  };

  return (
    <div className="space-y-20">
      {/* --------------------------------------------------- recommender */}
      <section aria-labelledby="finder-h" className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <H2 id="finder-h">{tx(locale, "Find your route")}</H2>
          <ChoiceGroup label={tx(locale, "I am a")} options={PERSONAS.map((o) => ({ ...o, label: tx(locale, o.label) }))} value={persona} onChange={setPersona} />
          <ChoiceGroup label={tx(locale, "My product is in")} options={AREAS.map((o) => ({ ...o, label: tx(locale, o.label) }))} value={area} onChange={setArea} />
        </div>
        <div className="lg:col-span-5" aria-live="polite">
          <div className="sheet h-full px-6 py-5">
            <p className="text-sm text-muted">{tx(locale, "Recommended route")}</p>
            <p className="mt-1 font-heading text-lg font-semibold text-ink">{recommendation.scheme.name}</p>
            <p className="mt-3 text-base text-body">{recommendation.why}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => openScheme(recommendation.id)} className="btn btn-primary">
                {tx(locale, "Open the walkthrough")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
              <Link href={`/assistant?q=${encodeURIComponent(recommendation.scheme.ask)}`} className="btn btn-secondary">
                {tx(locale, "Ask the assistant")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- walkthrough */}
      <section id="walkthrough" aria-labelledby="walk-h" className="scroll-mt-24">
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
          <nav aria-label="Certification routes" className="no-print lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
            <p className="text-sm font-semibold text-ink">{tx(locale, "Routes")}</p>
            <ul className="mt-2 flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible">
              {SCHEMES.map((s) => (
                <li key={s.id} className="shrink-0">
                  <button
                    type="button"
                    aria-pressed={active === s.id}
                    onClick={() => setActive(s.id)}
                    className={`w-full whitespace-nowrap rounded-md px-3 py-2 text-left text-sm transition-colors lg:whitespace-normal ${
                      active === s.id ? "bg-select-soft font-medium text-select-ink" : "text-body hover:bg-sunken"
                    }`}
                  >
                    {tx(locale, s.tab)}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <article className="min-w-0">
            <header className="border-b border-rule pb-6">
              <h2 id="walk-h" className="text-2xl font-bold tracking-[-0.025em]">
                {tx(locale, scheme.name)}
              </h2>
              <p className="mt-2 max-w-[64ch] text-md text-body">{scheme.tagline}</p>
              <dl className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted">{tx(locale, "Who applies")}</dt>
                  <dd className="mt-0.5 text-ink">{scheme.audience}</dd>
                </div>
                <div>
                  <dt className="text-muted">{tx(locale, "Legal basis")}</dt>
                  <dd className="mt-0.5 text-ink">{scheme.legalBasis}</dd>
                </div>
                <div>
                  <dt className="text-muted">{tx(locale, "Typical timeline")}</dt>
                  <dd className="mt-0.5 text-ink">{scheme.timeline}</dd>
                </div>
                <div>
                  <dt className="text-muted">{tx(locale, "Validity")}</dt>
                  <dd className="mt-0.5 text-ink">{scheme.validity}</dd>
                </div>
              </dl>
              <div className="mt-5 rounded-md border-l-2 border-attention bg-attention-soft px-4 py-3">
                <p className="text-sm font-semibold text-ink">{tx(locale, "When it is compulsory")}</p>
                <p className="mt-0.5 text-sm text-body">{scheme.whenMandatory}</p>
              </div>
            </header>

            <div className="grid gap-12 pt-8 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-w-0 space-y-12">
                {/* steps */}
                <section aria-labelledby="steps-h">
                  <h3 id="steps-h" className="text-lg font-semibold">
                    {tx(locale, "Steps")}
                  </h3>
                  <ol className="mt-4">
                    {scheme.steps.map((s, i) => (
                      <li key={s.title} className="relative grid grid-cols-[36px_minmax(0,1fr)] gap-x-4 pb-6 last:pb-0">
                        <div className="relative flex justify-center">
                          <span className="z-10 grid size-7 place-items-center rounded-full border border-navy bg-canvas text-xs font-bold text-ink">
                            {i + 1}
                          </span>
                          {i < scheme.steps.length - 1 && (
                            <span aria-hidden="true" className="absolute bottom-[-4px] top-7 w-px bg-rule-strong" />
                          )}
                        </div>
                        <div className="pt-0.5">
                          <div className="flex flex-wrap items-baseline gap-x-3">
                            <span className="text-base font-semibold text-ink">{s.title}</span>
                            {s.days && <span className="text-xs text-muted">{s.days}</span>}
                          </div>
                          <p className="mt-1 max-w-[64ch] text-base text-body">{s.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>

                {/* documents */}
                <section id="documents" aria-labelledby="docs-h" className="scroll-mt-24">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 id="docs-h" className="text-lg font-semibold">
                      {tx(locale, "Document checklist")}
                    </h3>
                    <span className="text-sm text-muted" aria-live="polite">
                      {doneDocs} {tx(locale, "of")} {scheme.documents.length} {tx(locale, "ready")}
                    </span>
                  </div>
                  <div
                    className="mt-3 h-1 w-full overflow-hidden rounded-full bg-warm"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={tx(locale, "Documents ready")}
                  >
                    <div className="h-full bg-success transition-[width]" style={{ width: `${pct}%` }} />
                  </div>
                  <ul className="mt-4 divide-y divide-rule border-y border-rule">
                    {scheme.documents.map((d) => {
                      const key = `${scheme.id}:${d}`;
                      const on = !!checked[key];
                      return (
                        <li key={d}>
                          <label className="flex cursor-pointer items-start gap-3 py-2.5 text-base text-body">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => writeChecklist({ ...checked, [key]: !on })}
                              className="peer sr-only"
                            />
                            <span
                              aria-hidden="true"
                              className={`mt-1 grid size-4 shrink-0 place-items-center rounded-xs border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-select ${
                                on ? "border-success bg-success text-white" : "border-rule-strong bg-surface"
                              }`}
                            >
                              {on && <Check className="size-3" strokeWidth={3} />}
                            </span>
                            <span className={on ? "text-muted line-through decoration-rule-strong" : ""}>{d}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2 text-xs text-muted">{tx(locale, "Ticked items are saved in this browser only.")}</p>
                </section>

                {/* pitfalls */}
                <section aria-labelledby="pit-h">
                  <h3 id="pit-h" className="text-lg font-semibold">
                    {tx(locale, "Why applications get rejected")}
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {scheme.pitfalls.map((p) => (
                      <li key={p} className="relative pl-5 text-base text-body">
                        <span aria-hidden="true" className="absolute left-0 top-[0.7em] h-0.5 w-2.5 bg-attention" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* margin */}
              <aside className="space-y-10">
                <section aria-labelledby="fees-h">
                  <h3 id="fees-h" className="text-base font-semibold">
                    {tx(locale, "Indicative costs")}
                  </h3>
                  <dl className="mt-3 divide-y divide-rule border-y border-rule">
                    {scheme.fees.map((f) => (
                      <div key={f.item} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 py-2.5">
                        <dt className="text-sm text-ink">{f.item}</dt>
                        <dd className="text-right text-sm font-semibold tabular-nums text-ink">{f.amount}</dd>
                        {f.note && <dd className="col-span-2 mt-0.5 text-xs text-muted">{f.note}</dd>}
                      </div>
                    ))}
                  </dl>
                  <p className="mt-2 text-xs text-muted">{INDICATIVE_NOTE}</p>
                </section>

                <section aria-labelledby="mark-h">
                  <h3 id="mark-h" className="text-base font-semibold">
                    {tx(locale, "What must appear on the product")}
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-body">
                    {scheme.marking.map((m) => (
                      <li key={m} className="relative pl-4">
                        <span aria-hidden="true" className="absolute left-0 top-[0.65em] h-px w-2 bg-slate" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </section>

                <section aria-labelledby="after-h">
                  <h3 id="after-h" className="text-base font-semibold">
                    {tx(locale, "After certification")}
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-body">
                    {scheme.after.map((a) => (
                      <li key={a} className="relative pl-4">
                        <span aria-hidden="true" className="absolute left-0 top-[0.65em] h-px w-2 bg-slate" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </section>

                <section aria-labelledby="next-h" className="no-print">
                  <h3 id="next-h" className="text-base font-semibold">
                    {tx(locale, "Next")}
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li>
                      <Link href={`/standards?q=${encodeURIComponent(scheme.standardsQuery)}`} className="link">
                        {tx(locale, "Standards for this route")}
                      </Link>
                    </li>
                    <li>
                      <Link href={`/labs?capability=${scheme.labCapability}`} className="link">
                        {tx(locale, "Laboratories that can test")}
                      </Link>
                    </li>
                    <li>
                      <Link href={`/assistant?q=${encodeURIComponent(scheme.ask)}`} className="link">
                        {tx(locale, "Ask the assistant about this route")}
                      </Link>
                    </li>
                    <li>
                      <button type="button" onClick={() => window.print()} className="link inline-flex items-center gap-1.5">
                        <Printer className="size-3.5" aria-hidden="true" />
                        {tx(locale, "Print this walkthrough")}
                      </button>
                    </li>
                  </ul>
                </section>
              </aside>
            </div>
          </article>
        </div>
      </section>

      {/* --------------------------------------------------- comparison */}
      <section aria-labelledby="cmp-h" className="no-print">
        <H2 id="cmp-h">{tx(locale, "The five routes side by side")}</H2>
        <div className="mt-6 overflow-x-auto rounded-lg border border-rule bg-surface">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-rule bg-sunken">
                <th scope="col" className="w-[16%] px-4 py-3 text-xs font-medium text-muted">
                  <span className="sr-only">{tx(locale, "Parameter")}</span>
                </th>
                {["Scheme-I (ISI)", "CRS (Scheme-II)", "FMCS", "Hallmarking", "Scheme-IV (CoC)"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-heading text-sm font-semibold text-ink">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {COMPARISON.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="px-4 py-3 text-sm font-medium text-muted">
                    {tx(locale, row.label)}
                  </th>
                  {row.values.map((v, i) => (
                    <td key={i} className="px-4 py-3 text-sm text-body">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------------------------------------------- readiness */}
      <section aria-labelledby="ready-h" className="no-print grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <H2 id="ready-h">{tx(locale, "Readiness check")}</H2>
          <p className="mt-2 text-base text-muted">{tx(locale, "Tick each statement that is true for your product.")}</p>
          <ul className="mt-5 divide-y divide-rule border-y border-rule">
            {READINESS.map((r) => {
              const on = !!answers[r.id];
              return (
                <li key={r.id}>
                  <label className="flex cursor-pointer items-start gap-3 py-3.5">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => setAnswers((a) => ({ ...a, [r.id]: !a[r.id] }))}
                      className="mt-1 size-4 shrink-0 accent-[#2d7778]"
                    />
                    <span>
                      <span className="block text-base font-medium text-ink">{r.q}</span>
                      <span className="mt-0.5 block text-sm text-muted">{r.hint}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="lg:col-span-5" aria-live="polite">
          <div className="sheet px-6 py-5 lg:sticky lg:top-[calc(var(--header-h)+24px)]">
            <p className="text-sm font-semibold text-ink">{tx(locale, "Routes that apply")}</p>
            {answered === 0 && (
              <p className="mt-2 text-sm text-muted">{tx(locale, "Matching routes appear here as you tick statements.")}</p>
            )}
            {answered > 0 && matches.length === 0 && (
              <p className="mt-2 text-sm text-body">
                {tx(locale, "Nothing matched. Your product is probably not notified, so voluntary certification is the practical route.")}
              </p>
            )}
            {matches.length > 0 && (
              <ul className="mt-3 divide-y divide-rule border-y border-rule">
                {matches.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => openScheme(m.id)}
                      className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm font-medium text-ink hover:text-select-ink"
                    >
                      {m.name}
                      <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {answered > 0 && (
              <Link
                href={`/assistant?q=${encodeURIComponent("Which BIS scheme applies to my product and what will it cost?")}`}
                className="btn btn-secondary mt-4 w-full"
              >
                {tx(locale, "Confirm with the assistant")}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- QCOs */}
      {stats.qcos.length > 0 && (
        <section aria-labelledby="qco-h" className="no-print">
          <H2 id="qco-h">Quality Control Orders in the catalogue</H2>
          <p className="mt-2 max-w-[68ch] text-base text-muted">
            A QCO is the legal instrument that turns a voluntary standard into a compulsory mark. Open an order to see the
            standards it covers. Of {stats.standards.toLocaleString("en-IN")} standards in the catalogue,{" "}
            {stats.mandatory.toLocaleString("en-IN")} fall under one.
          </p>
          <ul className="mt-6 grid gap-x-10 border-t border-rule md:grid-cols-2">
            {stats.qcos.map((q) => (
              <li key={q.qco} className="border-b border-rule">
                <Link
                  href={`/standards?mandatory=true&q=${encodeURIComponent(q.qco.replace(/ \(.*\)/, ""))}`}
                  className="flex items-baseline justify-between gap-4 py-3 text-sm text-ink hover:text-select-ink"
                >
                  <span>{q.qco}</span>
                  <span className="shrink-0 tabular-nums text-muted">
                    {q.count} {q.count === 1 ? "standard" : "standards"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------------------------------------------------------- FAQ */}
      <section aria-labelledby="faq-h" className="no-print max-w-[820px]">
        <H2 id="faq-h">Common questions</H2>
        <div className="mt-5 divide-y divide-rule border-y border-rule">
          {FAQS.map((f, i) => (
            <details key={f.q} className="group" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-medium text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="max-w-[68ch] pb-5 text-base text-body">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="max-w-[80ch] text-xs text-muted">
        Legal positions, fee schedules and scheme names are summarised from the BIS Act, 2016 and the BIS (Conformity
        Assessment) Regulations, 2018 for guidance only. Verify the current position with the Bureau of Indian Standards
        before you file.
      </p>
    </div>
  );
}
