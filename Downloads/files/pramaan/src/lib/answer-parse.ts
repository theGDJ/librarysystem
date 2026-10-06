/* Splits an assistant answer (the markdown string returned by /api/chat) into
 * typed segments so the interface can show which parts are catalogue data,
 * which are quoted guidance and which were written by the language model.
 *
 * The engine (lib/assistant/engine.ts) emits a small, fixed set of shapes:
 *   - optional model prose
 *   - standard rows   "- **IS 4151:2015** — Title _flags_ · scheme: X"
 *       with clause lines "  - Clause 6 — summary"
 *   - a lab list      "**Recommended testing facilities:**" + "- **Name** _(kind)_ — City, State · tests: a, b"
 *   - a doc extract   "From the BIS knowledge base — **Title**:" + "_excerpt…_"
 *   - a fixed lead    "Here's what the BIS knowledge base says on this:"
 *   - an install note "_Note: the embedded AI model file is not installed …_"
 * Anything that matches none of these is kept as plain markdown, so older or
 * unexpected messages still render. Parsing is presentation-only; the stored
 * message is never modified. */

export type StdRecord = {
  kind: "standard";
  code: string;
  title: string;
  mandatory: boolean;
  scheme: string | null;
  clauses: { clause: string; text: string }[];
};
export type LabRecord = {
  kind: "lab";
  name: string;
  type: string;
  city: string;
  state: string;
  tests: string[];
};

export type Segment =
  | { type: "prose"; text: string; generated: boolean }
  | { type: "standards"; items: StdRecord[] }
  | { type: "labs"; items: LabRecord[] }
  | { type: "extract"; title: string; text: string }
  | { type: "note"; text: string };

const LEADS = [
  "Here's what the BIS knowledge base says on this:",
  "BIS ज्ञान-आधार में इस विषय पर यह जानकारी है:",
];
const STD_RE = /^-\s+\*\*((?:IS|SP|NBC)[^*]*?)\*\*\s+—\s+(.*)$/i;
const CLAUSE_RE = /^\s+-\s+(?:Clause|खंड)\s+(\S+)\s+—\s+(.*)$/;
const LAB_HEAD_RE = /^\*\*(Recommended testing facilities|अनुशंसित परीक्षण प्रयोगशालाएँ):\*\*\s*$/;
const LAB_RE = /^-\s+\*\*(.+?)\*\*\s+_\((.+?)\)_\s+—\s+(.+?),\s+(.+?)\s+·\s+tests:\s*(.*)$/;
const DOC_HEAD_RE = /^(?:From the BIS knowledge base|BIS ज्ञान-आधार से)\s+—\s+\*\*(.+)\*\*:\s*$/;
const NOTE_RE = /^_(?:Note:|नोट:)\s*(.*)_\s*$/;

function parseStd(code: string, rest: string): StdRecord {
  // rest: "Title _**mandatory (QCO)** certification_ · scheme: ISI Mark (Scheme-I)"
  let title = rest;
  let scheme: string | null = null;
  const schemeMatch = rest.match(/·\s*(?:scheme|योजना):\s*(.+)$/);
  if (schemeMatch) {
    scheme = schemeMatch[1].trim();
    title = rest.slice(0, schemeMatch.index).trim();
  }
  const flagIdx = title.search(/\s_/);
  const flags = flagIdx >= 0 ? title.slice(flagIdx) : "";
  if (flagIdx >= 0) title = title.slice(0, flagIdx).trim();
  const mandatory = /mandatory|अनिवार्य/i.test(flags);
  return { kind: "standard", code: code.trim(), title, mandatory, scheme, clauses: [] };
}

export function parseAnswer(text: string, intent?: string): Segment[] {
  const lines = text.replace(/\r/g, "").split("\n");
  const out: Segment[] = [];
  let buf: string[] = [];
  let sawLead = false;

  const flush = () => {
    const t = buf.join("\n").trim();
    buf = [];
    if (!t) return;
    const isFirst = out.length === 0;
    const generated =
      isFirst && !sawLead && intent !== undefined && !["greeting", "fallback"].includes(intent);
    out.push({ type: "prose", text: t, generated });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (LEADS.includes(trimmed)) {
      flush();
      sawLead = true;
      continue;
    }

    const note = trimmed.match(NOTE_RE);
    if (note) {
      flush();
      const nt = note[1].replace(/`/g, "");
      out.push({ type: "note", text: nt.charAt(0).toUpperCase() + nt.slice(1) });
      continue;
    }

    const doc = trimmed.match(DOC_HEAD_RE);
    if (doc) {
      flush();
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      const body = (lines[j] ?? "").trim().replace(/^_/, "").replace(/_$/, "");
      out.push({ type: "extract", title: doc[1], text: body });
      i = j;
      continue;
    }

    const std = line.match(STD_RE);
    if (std) {
      flush();
      const items: StdRecord[] = [];
      let j = i;
      while (j < lines.length) {
        const m = lines[j].match(STD_RE);
        if (m) {
          items.push(parseStd(m[1], m[2]));
          j++;
          continue;
        }
        const c = lines[j].match(CLAUSE_RE);
        if (c && items.length) {
          items[items.length - 1].clauses.push({ clause: c[1], text: c[2] });
          j++;
          continue;
        }
        break;
      }
      out.push({ type: "standards", items });
      i = j - 1;
      continue;
    }

    if (LAB_HEAD_RE.test(trimmed)) {
      flush();
      const items: LabRecord[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const m = lines[j].match(LAB_RE);
        if (!m) break;
        items.push({
          kind: "lab",
          name: m[1],
          type: m[2],
          city: m[3],
          state: m[4],
          tests: m[5].split(",").map((s) => s.trim()).filter(Boolean),
        });
        j++;
      }
      if (items.length) out.push({ type: "labs", items });
      i = j - 1;
      continue;
    }

    buf.push(line);
  }
  flush();
  return out;
}
