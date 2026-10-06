"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUp,
  BookMarked,
  ChevronDown,
  FileText,
  FlaskConical,
  RotateCcw,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { parseAnswer, type LabRecord, type Segment, type StdRecord } from "@/lib/answer-parse";
import { standardHref, categoryLabel } from "@/lib/format";
import { Markdown } from "@/components/Markdown";
import { Notice, ObligationTag, StandardCode, TierLabel } from "@/components/ui";
import { useLocale } from "@/lib/locale-context";

type Citation = { kind: "standard" | "doc" | "lab"; ref: string; label: string; clause?: string };
type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  suggestions?: string[];
  intent?: string;
};

const SESSION_KEY = "pramaan_session";
const MAX_LEN = 2000;

const EXAMPLES: Record<Locale, { group: string; items: string[] }[]> = {
  en: [
    { group: "Products", items: ["Which standard applies to PVC cables?", "Is ISI mandatory for pressure cookers?"] },
    { group: "Standards", items: ["Explain IS 456:2000", "What does IS 1786 cover?"] },
    { group: "Process and fees", items: ["How do I get an ISI licence?", "What concessions do micro units get?"] },
    { group: "Hallmarking and verification", items: ["How do I verify a gold hallmark?", "Which labs test pressure cookers?"] },
  ],
  hi: [
    { group: "उत्पाद", items: ["सीमेंट पर कौन-सा मानक लागू है?", "प्रेशर कुकर का मानक क्या है?"] },
    { group: "प्रक्रिया", items: ["ISI लाइसेंस कैसे मिलता है?", "शुल्क कितना लगेगा?"] },
    { group: "हॉलमार्किंग", items: ["हॉलमार्क कैसे जाँचें?", "HUID क्या है?"] },
  ],
};

let msgSeq = 0;
const nextId = () => `m${Date.now().toString(36)}${(msgSeq++).toString(36)}`;

/* ------------------------------------------------------ source details */

type StdDetail = {
  code: string;
  title: string;
  summary: string;
  mandatory: boolean;
  scheme: string;
  qco: string | null;
  category: string;
  sections: { clause: string; title: string; summary: string }[];
};
type LabDetail = {
  name: string;
  city: string;
  state: string;
  kind: string;
  capabilities: string[];
  phone: string | null;
  email: string | null;
};

const detailCache = new Map<string, Promise<StdDetail | LabDetail | null>>();

function loadDetail(c: Citation): Promise<StdDetail | LabDetail | null> {
  const key = `${c.kind}:${c.ref}`;
  const hit = detailCache.get(key);
  if (hit) return hit;
  let p: Promise<StdDetail | LabDetail | null>;
  if (c.kind === "standard") {
    p = fetch(`/api/standards?code=${encodeURIComponent(c.ref)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { standards: StdDetail[] }) => d.standards.find((s) => s.code === c.ref) ?? d.standards[0] ?? null);
  } else if (c.kind === "lab") {
    p = fetch(`/api/labs?q=${encodeURIComponent(c.ref)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { labs: LabDetail[] }) => d.labs.find((l) => l.name === c.ref) ?? null);
  } else {
    p = Promise.resolve(null);
  }
  p = p.catch((e) => {
    detailCache.delete(key);
    throw e;
  });
  detailCache.set(key, p);
  return p;
}

function SourceRow({ c, n, onAsk }: { c: Citation; n: number; onAsk: (q: string) => void }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [detail, setDetail] = useState<StdDetail | LabDetail | null>(null);
  const panelId = useId();

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && state !== "ready" && c.kind !== "doc") {
      setState("loading");
      loadDetail(c)
        .then((d) => {
          setDetail(d);
          setState("ready");
        })
        .catch(() => setState("error"));
    }
  };

  const Icon = c.kind === "standard" ? BookMarked : c.kind === "lab" ? FlaskConical : FileText;
  const kindLabel = c.kind === "standard" ? "Standard" : c.kind === "lab" ? "Laboratory" : "Article";

  return (
    <li id={`src-${n}`} className="border-t border-rule first:border-t-0">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="grid w-full grid-cols-[28px_1fr_auto] items-start gap-2 py-2.5 text-left hover:bg-sunken/60"
      >
        <span className="pt-px text-xs font-semibold tabular-nums text-muted">[{n}]</span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="inline-flex items-center gap-1 text-2xs text-muted">
              <Icon className="size-3" aria-hidden="true" />
              {kindLabel}
            </span>
            <span className={c.kind === "standard" ? "id text-sm" : "text-sm font-medium text-ink"}>
              {c.kind === "doc" ? c.label.replace(/ — knowledge base$/, "") : c.ref}
            </span>
          </span>
          {c.kind !== "doc" && <span className="mt-0.5 block text-sm text-body">{c.label}</span>}
        </span>
        <ChevronDown
          className={`mt-1 size-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div id={panelId} className="mb-3 ml-[36px] rounded-md bg-sunken px-4 py-3 text-sm">
          {state === "loading" && <span className="text-muted">Loading the record…</span>}
          {state === "error" && (
            <span className="text-danger">
              The record could not be loaded.{" "}
              <button type="button" className="link" onClick={() => { setState("idle"); setOpen(false); }}>
                Close and retry
              </button>
            </span>
          )}
          {c.kind === "doc" && (
            <div className="space-y-2">
              <TierLabel tier="extract" note={`Article reference: ${c.ref}`} />
              <p className="text-body">
                The answer quotes or draws on this guidance article from Pramaan&apos;s knowledge base. Articles cover
                schemes, processes, fees and verification rather than a single standard.
              </p>
              <button type="button" className="link text-sm" onClick={() => onAsk(`Tell me more about ${c.label}`)}>
                Ask a follow-up about this article
              </button>
            </div>
          )}
          {state === "ready" && !detail && <span className="text-muted">No matching record was found in the catalogue.</span>}
          {state === "ready" && detail && c.kind === "standard" && (() => {
            const s = detail as StdDetail;
            return (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <TierLabel tier="record" />
                  <ObligationTag mandatory={s.mandatory} long />
                </div>
                <p className="text-body">{s.summary}</p>
                <dl className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-1 text-xs">
                  <dt className="text-muted">Scheme</dt>
                  <dd className="text-ink">{s.scheme}</dd>
                  {s.qco && (
                    <>
                      <dt className="text-muted">Legal basis</dt>
                      <dd className="text-ink">{s.qco}</dd>
                    </>
                  )}
                  <dt className="text-muted">Category</dt>
                  <dd className="text-ink">{categoryLabel(s.category)}</dd>
                </dl>
                <Link href={standardHref(s.code)} className="link inline-block text-sm">
                  Open the full record for {s.code}
                </Link>
              </div>
            );
          })()}
          {state === "ready" && detail && c.kind === "lab" && (() => {
            const l = detail as LabDetail;
            return (
              <div className="space-y-2">
                <TierLabel tier="record" note="Contact details are illustrative" />
                <p className="text-body">
                  {l.kind} in {l.city}, {l.state}. Tests {l.capabilities.map(categoryLabel).join(", ").toLowerCase()}.
                </p>
                {(l.phone || l.email) && (
                  <p className="text-xs text-muted">
                    {l.phone}
                    {l.phone && l.email ? " · " : ""}
                    {l.email}
                  </p>
                )}
                <Link href={`/labs?q=${encodeURIComponent(l.name)}`} className="link inline-block text-sm">
                  View in the laboratory directory
                </Link>
              </div>
            );
          })()}
        </div>
      )}
    </li>
  );
}

/* ------------------------------------------------------- answer body */

function citeIndex(citations: Citation[] | undefined, kind: Citation["kind"], match: (c: Citation) => boolean) {
  if (!citations) return 0;
  const i = citations.findIndex((c) => c.kind === kind && match(c));
  return i + 1;
}

function Ref({ n }: { n: number }) {
  if (!n) return null;
  return (
    <a
      href={`#src-${n}`}
      className="ml-1 align-super text-[10px] font-semibold text-select-ink no-underline hover:underline"
      aria-label={`Source ${n}`}
    >
      [{n}]
    </a>
  );
}

function StandardsBlock({ items, msg, locale }: { items: StdRecord[]; msg: Msg; locale: Locale }) {
  return (
    <section className="ev ev-record">
      <TierLabel tier="record" note={t(locale, "chat.records")} />
      <ul className="mt-2 divide-y divide-rule">
        {items.map((s) => (
          <li key={s.code} className="py-3 first:pt-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <StandardCode code={s.code} className="text-[15px]" />
              <ObligationTag mandatory={s.mandatory} />
              <Ref n={citeIndex(msg.citations, "standard", (c) => c.ref === s.code)} />
            </div>
            <p className="mt-1 text-base font-medium text-ink">{s.title}</p>
            {s.scheme && <p className="mt-0.5 text-sm text-muted">{s.scheme}</p>}
            {s.clauses.length > 0 && (
              <ol className="mt-2.5 space-y-1.5">
                {s.clauses.map((c) => (
                  <li key={c.clause} className="grid grid-cols-[56px_1fr] gap-2 text-sm">
                    <span className="id text-xs text-muted">cl. {c.clause}</span>
                    <span className="text-body">{c.text}</span>
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function LabsBlock({ items, msg, locale }: { items: LabRecord[]; msg: Msg; locale: Locale }) {
  return (
    <section className="ev ev-record">
      <TierLabel tier="record" note={t(locale, "chat.labs")} />
      <ul className="mt-2 divide-y divide-rule">
        {items.map((l) => (
          <li key={l.name} className="grid gap-x-4 py-2.5 sm:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <span className="text-sm font-medium text-ink">{l.name}</span>
              <Ref n={citeIndex(msg.citations, "lab", (c) => c.ref === l.name)} />
              <p className="text-xs text-muted">
                {l.type} · {l.city}, {l.state}
              </p>
            </div>
            <p className="text-xs text-muted sm:text-right">{l.tests.map(categoryLabel).join(", ")}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AnswerBody({ msg, locale }: { msg: Msg; locale: Locale }) {
  const segments: Segment[] = parseAnswer(msg.content, msg.intent);
  return (
    <div className="space-y-6">
      {segments.map((seg, i) => {
        switch (seg.type) {
          case "prose":
            return seg.generated ? (
              <section key={i} className="ev ev-model">
                <TierLabel tier="model" note={t(locale, "chat.composed")} />
                <Markdown text={seg.text} className="reading mt-1.5" />
              </section>
            ) : (
              <Markdown key={i} text={seg.text} />
            );
          case "standards":
            return <StandardsBlock key={i} items={seg.items} msg={msg} locale={locale} />;
          case "labs":
            return <LabsBlock key={i} items={seg.items} msg={msg} locale={locale} />;
          case "extract":
            return (
              <section key={i} className="ev ev-extract">
                <TierLabel tier="extract" note={seg.title} />
                <blockquote className="reading mt-1.5">
                  <p>{seg.text}</p>
                </blockquote>
                <Ref n={citeIndex(msg.citations, "doc", (c) => c.label === seg.title)} />
              </section>
            );
          case "note":
            return (
              <p key={i} className="text-xs text-muted">
                {seg.text}
              </p>
            );
        }
      })}
    </div>
  );
}

/* ------------------------------------------------------------ the app */

export function ChatClient({ recent = [] }: { recent?: string[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const localeContext = useLocale();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const locale = localeContext.locale;
  const setLocale = localeContext.setLocale;
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [failed, setFailed] = useState<{ text: string; loc: Locale } | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const sessionRef = useRef<string | null>(null);
  const sendingRef = useRef(false);
  const handledQ = useRef<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const composerId = useId();

  const scrollToEnd = useCallback(() => {
    /* scroll the page to its end, so the sticky composer sits below the latest content instead of over it */
    requestAnimationFrame(() =>
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      }),
    );
  }, []);

  const setSession = (id: string | null) => {
    sessionRef.current = id;
    setHasSession(!!id);
    try {
      if (id) localStorage.setItem(SESSION_KEY, id);
      else localStorage.removeItem(SESSION_KEY);
    } catch {}
  };

  const send = useCallback(
    async (raw: string, loc: Locale, opts: { retry?: boolean } = {}) => {
      const text = raw.trim();
      if (!text || text.length > MAX_LEN || sendingRef.current) return;
      sendingRef.current = true;
      setBusy(true);
      setSlow(false);
      setFailed(null);
      const useLoc: Locale = /[\u0900-\u097F]/.test(text) ? "hi" : loc;
      if (!opts.retry) setMessages((m) => [...m, { id: nextId(), role: "user", content: text }]);
      setInput("");
      scrollToEnd();
      const slowTimer = setTimeout(() => setSlow(true), 6000);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, sessionId: sessionRef.current, locale: useLoc }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || typeof data.text !== "string") throw new Error(data.error ?? `HTTP ${res.status}`);
        if (data.sessionId) setSession(data.sessionId);
        setMessages((m) => [
          ...m,
          {
            id: nextId(),
            role: "assistant",
            content: data.text,
            citations: data.citations,
            suggestions: data.suggestions,
            intent: data.intent,
          },
        ]);
      } catch {
        setFailed({ text, loc: useLoc });
      } finally {
        clearTimeout(slowTimer);
        setBusy(false);
        setSlow(false);
        sendingRef.current = false;
        scrollToEnd();
        inputRef.current?.focus();
      }
    },
    [scrollToEnd],
  );

  /* boot: restore the stored conversation, then answer any ?q= deep link */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(SESSION_KEY);
      } catch {}
      if (stored) {
        try {
          const res = await fetch(`/api/chat?sessionId=${encodeURIComponent(stored)}`);
          const data: { messages?: { role: string; content: string; citations?: Citation[]; intent?: string | null }[] } =
            await res.json();
          const restored = (data.messages ?? []).map<Msg>((m) => ({
            id: nextId(),
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
            citations: m.citations ?? [],
            intent: m.intent ?? undefined,
          }));
          if (cancelled) return;
          if (restored.length) {
            sessionRef.current = stored;
            setHasSession(true);
            setMessages(restored);
          } else {
            // the session no longer exists on this server — start fresh
            setSession(null);
          }
        } catch {
          sessionRef.current = stored;
          setHasSession(true);
        }
      }
      if (!cancelled) setRestoring(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* deep links (/assistant?q=…) — handled once, then removed from the URL so a reload does not re-ask */
  const q = params.get("q");
  useEffect(() => {
    if (restoring || !q || handledQ.current === q) return;
    handledQ.current = q;
    send(q, locale);
    router.replace("/assistant", { scroll: false });
  }, [q, restoring, send, locale, router]);

  useEffect(() => {
    if (!restoring && messages.length) scrollToEnd();
    // only after the restore completes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoring]);

  /* auto-grow the composer */
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const newChat = () => {
    setMessages([]);
    setFailed(null);
    setSession(null);
    inputRef.current?.focus();
  };

  const ask = (text: string) => send(text, locale);
  const questions = messages.filter((m) => m.role === "user").length;
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const tooLong = input.length > MAX_LEN;

  return (
    <div className="mx-auto grid max-w-[1240px] gap-10 px-5 sm:px-8 lg:grid-cols-[260px_minmax(0,1fr)] xl:gap-16">
      {/* -------------------------------------------------- context rail */}
      <aside aria-label="Research context" className="order-2 lg:order-1">
        <div className="space-y-8 lg:sticky lg:top-[calc(var(--header-h)+32px)]">
          <section>
            <h2 className="text-sm font-semibold">{t(locale, "chat.context")}</h2>
            <p className="mt-1.5 text-sm text-muted">
              {questions} {t(locale, questions === 1 ? "chat.count1" : "chat.countN")}.{" "}
              {hasSession && t(locale, "chat.saved")}
            </p>
            <button type="button" onClick={newChat} disabled={busy} className="btn btn-secondary btn-sm mt-3">
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {t(locale, "chat.new")}
            </button>
          </section>

          <section>
            <h2 id="lang-label" className="text-sm font-semibold">
              {t(locale, "chat.language")}
            </h2>
            <div role="group" aria-labelledby="lang-label" className="mt-2 flex gap-1.5">
              {(["en", "hi"] as Locale[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={locale === l}
                  onClick={() => setLocale(l)}
                  className="choice"
                >
                  {l === "en" ? "English" : "हिन्दी"}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold">{t(locale, "chat.examples")}</h2>
            <div className="mt-2 space-y-3">
              {EXAMPLES[locale].map((g) => (
                <div key={g.group}>
                  <p className="text-xs text-muted">{g.group}</p>
                  <ul className="mt-1 space-y-0.5">
                    {g.items.map((x) => (
                      <li key={x}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => ask(x)}
                          className="w-full rounded-sm py-1 text-left text-sm text-ink hover:text-select-ink disabled:opacity-50"
                        >
                          {x}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {recent.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold">{t(locale, "chat.recent")}</h2>
              <ul className="mt-2 space-y-0.5">
                {recent.map((r, i) => (
                  <li key={`${r}-${i}`}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => ask(r)}
                      title={r}
                      className="w-full truncate rounded-sm py-1 text-left text-sm text-muted hover:text-ink disabled:opacity-50"
                    >
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------- thread */}
      <div className="order-1 min-w-0 lg:order-2">
        <div className="max-w-[760px]">
          <div aria-live="polite" aria-busy={busy}>
            {restoring && <p className="py-10 text-sm text-muted">{t(locale, "chat.restoring")}…</p>}

            {!restoring && messages.length === 0 && !busy && (
              <section className="pb-6 pt-2">
                <h1 className="text-2xl font-bold tracking-[-0.025em] sm:text-[2.25rem] sm:leading-[2.6rem]">
                  {t(locale, "chat.empty.title")}
                </h1>
                <p className="mt-4 max-w-[60ch] text-md text-muted">{t(locale, "chat.empty.body")}</p>
                <ol className="mt-8 space-y-5 border-t border-rule pt-6">
                  <li className="ev ev-record">
                    <TierLabel tier="record" />
                    <p className="mt-1 text-sm text-body">
                      Codes, obligations, schemes, clauses and laboratories, rendered directly from the catalogue.
                    </p>
                  </li>
                  <li className="ev ev-extract">
                    <TierLabel tier="extract" />
                    <p className="mt-1 text-sm text-body">Guidance quoted from a named scheme or process article.</p>
                  </li>
                  <li className="ev ev-model">
                    <TierLabel tier="model" />
                    <p className="mt-1 text-sm text-body">
                      A short summary by the language model running on this server. Read it alongside the records.
                    </p>
                  </li>
                </ol>
              </section>
            )}

            {messages.map((m, idx) =>
              m.role === "user" ? (
                <h2
                  key={m.id}
                  className={`font-heading text-lg font-semibold leading-snug tracking-[-0.01em] text-ink ${
                    idx === 0 ? "pt-2" : "mt-12 border-t border-rule pt-8"
                  }`}
                >
                  {m.content}
                </h2>
              ) : (
                <article key={m.id} className="mt-5">
                  <AnswerBody msg={m} locale={locale} />
                  {m.citations && m.citations.length > 0 && (
                    <section className="mt-7">
                      <h3 className="text-sm font-semibold text-ink">
                        {t(locale, "chat.sources")} <span className="font-normal text-muted">({m.citations.length})</span>
                      </h3>
                      <ol className="mt-1.5 border-y border-rule">
                        {m.citations.map((c, j) => (
                          <SourceRow key={`${c.kind}-${c.ref}`} c={c} n={j + 1} onAsk={ask} />
                        ))}
                      </ol>
                    </section>
                  )}
                  {m === lastAssistant && !busy && m.suggestions && m.suggestions.length > 0 && (
                    <section className="mt-6">
                      <h3 className="text-sm font-semibold text-ink">{t(locale, "chat.suggested")}</h3>
                      <ul className="mt-2 flex flex-col items-start gap-1">
                        {m.suggestions.map((s) => (
                          <li key={s}>
                            <button
                              type="button"
                              onClick={() => ask(s)}
                              className="link text-left text-sm font-normal"
                            >
                              {s}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </article>
              ),
            )}

            {busy && (
              <div className="mt-5 flex flex-col gap-1 text-sm text-muted" role="status">
                <span className="inline-flex items-center gap-3">
                  <span className="dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  {t(locale, "chat.thinking")}
                </span>
                {slow && <span className="text-xs">{t(locale, "chat.slow")}</span>}
              </div>
            )}

            {failed && !busy && (
              <div className="mt-5">
                <Notice
                  tone="danger"
                  title={t(locale, "chat.error")}
                  action={
                    <button type="button" onClick={() => send(failed.text, failed.loc, { retry: true })} className="btn btn-secondary btn-sm">
                      <RotateCcw className="size-3.5" aria-hidden="true" />
                      {t(locale, "chat.retry")}
                    </button>
                  }
                >
                  {t(locale, "chat.errorBody")}
                </Notice>
              </div>
            )}
          </div>
          <div ref={endRef} className="h-4" />

          {/* ------------------------------------------------- composer */}
          <div className="sticky bottom-0 z-10 -mx-5 mt-6 bg-canvas px-5 pb-4 pt-3 sm:-mx-0 sm:px-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input, locale);
              }}
              className="rounded-lg border border-rule-strong bg-surface p-2 transition-colors focus-within:border-select focus-within:ring-[3px] focus-within:ring-select-soft"
            >
              <label htmlFor={composerId} className="sr-only">
                {t(locale, "chat.title")}
              </label>
              <textarea
                id={composerId}
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send(input, locale);
                  }
                }}
                rows={1}
                placeholder={t(locale, "chat.placeholder")}
                aria-invalid={tooLong}
                aria-describedby={`${composerId}-help`}
                className="block max-h-[200px] w-full resize-none bg-transparent px-2.5 py-2 text-md text-ink placeholder:text-[#8592a3] focus:outline-none"
              />
              <div className="flex items-center justify-between gap-3 pl-2.5">
                <span id={`${composerId}-help`} className={`text-2xs ${tooLong ? "text-danger" : "text-muted"}`}>
                  {tooLong
                    ? `${t(locale, "chat.tooLong")} (${input.length.toLocaleString("en-IN")})`
                    : input.length > MAX_LEN - 200
                      ? `${(MAX_LEN - input.length).toLocaleString("en-IN")} characters left`
                      : <span className="hidden sm:inline">{t(locale, "chat.keys")}</span>}
                </span>
                <button
                  type="submit"
                  disabled={busy || !input.trim() || tooLong}
                  className="btn btn-primary btn-sm"
                >
                  {t(locale, "chat.send")}
                  <ArrowUp className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </form>
            <p className="mt-2 text-2xs text-muted">{t(locale, "chat.disclaimer")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
