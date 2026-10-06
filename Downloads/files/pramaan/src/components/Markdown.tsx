/* Markdown-lite renderer (no dependency): **bold**, _italic_, `code`,
 * "- " bullets (one nesting level), "1. " numbered lists, "---" rules and
 * paragraphs. Used for assistant prose and guidance text. */
import type { ReactNode } from "react";

function inline(text: string, key: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|`([^`]+)`|(^|[\s(])_(.+?)_(?=[\s.,;:)!?]|$))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2] !== undefined) parts.push(<strong key={`${key}b${k++}`}>{m[2]}</strong>);
    else if (m[3] !== undefined)
      parts.push(
        <code key={`${key}c${k++}`} className="id rounded-xs bg-sunken px-1 text-[0.85em]">
          {m[3]}
        </code>,
      );
    else {
      parts.push(m[4]);
      parts.push(
        <em key={`${key}i${k++}`} className="not-italic text-muted">
          {m[5]}
        </em>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Markdown({ text, className = "reading" }: { text: string; className?: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^---+\s*$/.test(line.trim())) {
      blocks.push(<hr key={key++} className="my-5 border-rule" />);
      i++;
    } else if (/^\s*-\s+/.test(line)) {
      const items: { text: string; nested: boolean }[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push({ text: lines[i].replace(/^\s*-\s+/, ""), nested: /^\s{2,}-/.test(lines[i]) });
        i++;
      }
      const k = key++;
      blocks.push(
        <ul key={k} className="my-3 space-y-1.5">
          {items.map((it, j) => (
            <li key={j} className={`relative pl-5 ${it.nested ? "ml-5 text-[0.95em] text-muted" : ""}`}>
              <span aria-hidden="true" className="absolute left-1 top-[0.72em] h-px w-2 bg-slate" />
              {inline(it.text, `u${k}-${j}`)}
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
      const k = key++;
      blocks.push(
        <ol key={k} className="my-3 space-y-1.5">
          {items.map((it, j) => (
            <li key={j} className="grid grid-cols-[1.75rem_1fr]">
              <span className="text-muted tabular-nums">{j + 1}.</span>
              <span>{inline(it, `o${k}-${j}`)}</span>
            </li>
          ))}
        </ol>,
      );
    } else if (!line.trim()) {
      i++;
    } else {
      const k = key++;
      blocks.push(<p key={k}>{inline(line, `p${k}`)}</p>);
      i++;
    }
  }
  return <div className={className}>{blocks}</div>;
}
