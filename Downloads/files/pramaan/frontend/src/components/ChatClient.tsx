"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  SendHorizonal,
  User,
  BookMarked,
  FlaskConical,
  FileText,
  RotateCcw,
  ShieldCheck,
  Loader2,
  Languages,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type Citation = { kind: "standard" | "doc" | "lab"; ref: string; label: string; clause?: string };
type Msg = {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  suggestions?: string[];
  intent?: string;
};

/* ------------------------- markdown-lite renderer ------------------------ */

function renderInline(text: string, keyPrefix: string) {
  const parts: React.ReactNode[] = [];
  let rest = text;
  let k = 0;
  while (rest.length) {
    const bold = rest.match(/\*\*(.+?)\*\*/);
    const ital = rest.match(/_(.+?)_/);
    const cut = [bold?.index, ital?.index].filter((x) => x !== undefined) as number[];
    if (!cut.length) {
      parts.push(rest);
      break;
    }
    const nextQ = Math.min(...cut);
    if (nextQ > 0) parts.push(rest.slice(0, nextQ));
    if (bold && bold.index === nextQ) {
      parts.push(
        <strong key={`${keyPrefix}-b${k++}`} className="font-semibold text-gold-200">
          {bold[1]}
        </strong>,
      );
      rest = rest.slice(bold.index + bold[0].length);
    } else if (ital) {
      parts.push(
        <em key={`${keyPrefix}-i${k++}`} className="not-italic text-ash-400">
          {ital[1]}
        </em>,
      );
      rest = rest.slice(ital.index! + ital[0].length);
    }
  }
  return parts;
}

export function Markdown({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^---+\s*$/.test(line.trim())) {
      blocks.push(<hr key={key++} className="my-4 border-t border-dashed border-line" />);
      i++;
    } else if (/^-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^-\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="my-2.5">
          {items.map((it, j) => (
            <li key={j} className="relative mb-2 pl-5 leading-relaxed">
              <span className="absolute left-0.5 top-[0.6em] size-1.5 rounded-[3px] bg-gold-400" />
              {renderInline(it, `li-${key}-${j}`)}
            </li>
          ))}
        </ul>,
      );
    } else if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} className="my-2.5">
          {items.map((it, j) => (
            <li key={j} className="relative mb-2.5 pl-10 leading-relaxed">
              <span className="mono absolute left-0 top-[0.15em] grid size-6 place-items-center rounded-md border border-gold-500/40 bg-gold-400/10 text-[10px] text-gold-300">
                {String(j + 1).padStart(2, "0")}
              </span>
              {renderInline(it, `ol-${key}-${j}`)}
            </li>
          ))}
        </ol>,
      );
    } else if (line.trim() === "") {
      i++;
    } else {
      blocks.push(
        <p key={key++} className="mb-3 leading-[1.75]">
          {renderInline(line, `p-${key}`)}
        </p>,
      );
      i++;
    }
  }
  return <div className="md text-[14.5px]">{blocks}</div>;
}

function CitationChip({ c }: { c: Citation }) {
  const Icon = c.kind === "standard" ? BookMarked : c.kind === "lab" ? FlaskConical : FileText;
  return (
    <span className="chip inline-flex items-center gap-1.5 py-1 text-[10.5px] text-ash-300">
      <Icon className="size-3 text-gold-400" />
      <span className="font-medium text-gold-200">{c.ref}</span>
      <span className="max-w-[220px] truncate opacity-80">{c.label}</span>
      {c.clause && <span className="text-ash-500">· {c.clause}</span>}
    </span>
  );
}

/* ------------------------------- component ------------------------------ */

export function ChatClient() {
  const params = useSearchParams();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [locale, setLocale] = useState<Locale>("en");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [greeted, setGreeted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  const send = useCallback(
    async (text: string, loc: Locale) => {
      if (!text.trim() || sendingRef.current) return;
      sendingRef.current = true;
      setBusy(true);
      setMessages((m) => [...m, { role: "user", content: text.trim() }]);
      setInput("");
      scrollToEnd();
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim(), sessionId, locale: loc }),
        });
        const data = await res.json();
        if (data.sessionId) {
          setSessionId(data.sessionId);
          try {
            localStorage.setItem("pramaan_session", data.sessionId);
          } catch {}
        }
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data.text ?? "…",
            citations: data.citations,
            suggestions: data.suggestions,
            intent: data.intent,
          },
        ]);
      } catch {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Something went wrong reaching the knowledge base. Please retry." },
        ]);
      } finally {
        setBusy(false);
        sendingRef.current = false;
        scrollToEnd();
        inputRef.current?.focus();
      }
    },
    [sessionId, scrollToEnd],
  );

  /* greeting + query param */
  useEffect(() => {
    if (greeted) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only boot: mark greeted, restore session, then fire first message
    setGreeted(true);
    const stored = (() => {
      try {
        return localStorage.getItem("pramaan_session");
      } catch {
        return null;
      }
    })();
    if (stored) setSessionId(stored);

    const q = params.get("q");
    if (q) {
      send(q, /[\u0900-\u097F]/.test(q) ? "hi" : locale);
    } else {
      send(locale === "hi" ? "नमस्ते" : "hello", locale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const newChat = () => {
    setMessages([]);
    setSessionId(null);
    try {
      localStorage.removeItem("pramaan_session");
    } catch {}
    send(locale === "hi" ? "नमस्ते" : "hello", locale);
  };

  const lastSuggestions = [...messages].reverse().find((m) => m.suggestions?.length)?.suggestions;

  return (
    <div className="flex h-[calc(100svh-120px)] min-h-[560px] flex-col">
      {/* toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <span className="relative grid size-10 place-items-center rounded-xl border border-gold-500/50 bg-gradient-to-br from-gold-400/20 to-transparent">
            <ShieldCheck className="size-5 text-gold-300" strokeWidth={1.8} />
          </span>
          <div>
            <div className="text-[15px] font-semibold text-white">{t(locale, "chat.ai")}</div>
            <div className="mono flex items-center gap-1.5 text-[10px] tracking-[0.18em] text-jade-400">
              <span className="inline-block size-1.5 rounded-full bg-jade-400" />
              {t(locale, "chat.hint")}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocale(locale === "en" ? "hi" : "en")}
            className="btn-ghost px-3.5 py-2 text-[12px]"
            title="Switch language"
          >
            <Languages className="size-3.5" />
            {locale === "en" ? "हिन्दी" : "English"}
          </button>
          <button onClick={newChat} className="btn-ghost px-3.5 py-2 text-[12px]">
            <RotateCcw className="size-3.5" />
            {t(locale, "chat.new")}
          </button>
        </div>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto py-6 pr-1 [scrollbar-width:thin]">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-3.5 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg border border-gold-500/40 bg-gold-400/10">
                <ShieldCheck className="size-4 text-gold-300" />
              </span>
            )}
            <div className={`max-w-[820px] ${m.role === "user" ? "w-fit" : "flex-1"}`}>
              <div
                className={
                  m.role === "user"
                    ? "rounded-2xl rounded-br-md border border-line bg-ink-800 px-4.5 py-3 text-[14.5px] text-white"
                    : "rounded-2xl rounded-tl-md border border-line bg-ink-850/80 px-5 py-4 text-ash-300"
                }
              >
                {m.role === "user" ? m.content : <Markdown text={m.content} />}
              </div>
              {m.citations && m.citations.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="mono text-[10px] uppercase tracking-[0.2em] text-ash-500">
                    {t(locale, "chat.sources")}
                  </span>
                  {m.citations.map((c, j) => (
                    <CitationChip key={j} c={c} />
                  ))}
                </div>
              )}
            </div>
            {m.role === "user" && (
              <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-ink-800">
                <User className="size-4 text-ash-400" />
              </span>
            )}
          </div>
        ))}

        {busy && (
          <div className="flex gap-3.5">
            <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg border border-gold-500/40 bg-gold-400/10">
              <Loader2 className="size-4 animate-spin text-gold-300" />
            </span>
            <div className="panel-flat flex items-center gap-3 px-5 py-3.5">
              <span className="loading-beam h-1.5 w-28 rounded-full bg-ink-700" />
              <span className="mono text-[10px] uppercase tracking-[0.22em] text-ash-500">
                {t(locale, "chat.thinking")}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* suggestions */}
      {lastSuggestions && !busy && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="mono text-[10px] uppercase tracking-[0.2em] text-ash-500">
            {t(locale, "chat.suggested")}
          </span>
          {lastSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s, locale)}
              className="chip card-hover py-1.5 text-[11.5px] text-ash-300 hover:border-gold-500/50 hover:text-gold-200"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input, locale);
        }}
        className="flex items-end gap-2 rounded-2xl border border-line bg-ink-850/90 p-2 backdrop-blur transition-colors focus-within:border-gold-500/60"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input, locale);
            }
          }}
          rows={1}
          placeholder={t(locale, "chat.placeholder")}
          className="max-h-36 flex-1 resize-none bg-transparent px-3 py-2.5 text-[14.5px] text-white placeholder:text-ash-500"
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn-gold size-11 justify-center rounded-xl disabled:opacity-40">
          <SendHorizonal className="size-4.5" />
        </button>
      </form>
      <p className="mt-2.5 text-[11px] leading-relaxed text-ash-500">{t(locale, "chat.disclaimer")}</p>
    </div>
  );
}
