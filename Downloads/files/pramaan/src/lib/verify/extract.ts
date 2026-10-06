export type MarkType = "isi" | "crs" | "jeweller" | "huid";

export type Candidate = {
  type: MarkType;
  raw: string;
  normalised: string;
  confidence: number;
};

export const MARK_PATTERNS: Record<MarkType, RegExp> = {
  isi: /^CM\/L-\d{10}$/,
  crs: /^R-\d{11}$/,
  jeweller: /^HM\/C-\d{9}$/,
  huid: /^[A-Z0-9]{6}$/,
};

export const IS_CODE_PATTERN = /(?:is|आईएस)[\s:/-]*(\d{2,6})(?:\s*[-–:]\s*(\d{2,4}))?/i;

const DIGIT_FIXES: Record<string, string> = { O: "0", I: "1", S: "5", B: "8" };

function fixDigits(value: string): string {
  return value.replace(/[OISB]/g, (char) => DIGIT_FIXES[char]);
}

function compact(value: string): string {
  return value.toUpperCase().replace(/[\s‐‑‒–—]/g, "");
}

function normalizeMark(raw: string): { type: MarkType; normalised: string } | null {
  const text = compact(raw);

  // Prefix variants are explicit; OCR substitutions are never applied to prefixes.
  const isi = text.match(/^(CM\/(?:L|I)|CMIL|CMI|CM\/L)(-?)([0-9OISB]{10})$/);
  if (isi) {
    const number = fixDigits(isi[3]);
    const normalised = "CM/L-" + number;
    return MARK_PATTERNS.isi.test(normalised) ? { type: "isi", normalised } : null;
  }

  const crs = text.match(/^R-?([0-9OISB]{11})$/);
  if (crs) {
    const normalised = "R-" + fixDigits(crs[1]);
    return MARK_PATTERNS.crs.test(normalised) ? { type: "crs", normalised } : null;
  }

  const jeweller = text.match(/^HM\/?C-?([0-9OISB]{9})$/);
  if (jeweller) {
    const normalised = "HM/C-" + fixDigits(jeweller[1]);
    return MARK_PATTERNS.jeweller.test(normalised) ? { type: "jeweller", normalised } : null;
  }
  return null;
}

function hasHuidContext(text: string, start: number, end: number): boolean {
  const nearby = text.slice(Math.max(0, start - 24), Math.min(text.length, end + 24));
  return /\bH\s*U\s*I\s*D\b/i.test(nearby);
}

/** Extract registry-shaped identifiers only. HUID needs an adjacent HUID label. */
export function extractMarks(ocrText: string): Candidate[] {
  const results: Candidate[] = [];
  const seen = new Set<string>();
  const push = (candidate: Candidate) => {
    const key = candidate.type + ":" + candidate.normalised;
    if (seen.has(key)) return;
    seen.add(key);
    results.push(candidate);
  };

  const markPatterns = [
    /(?:CM\s*\/\s*[LI1]|CM\s*I\s*L|CMIL)\s*-?\s*(?:[0-9OISB]\s*){10}/gi,
    /\bR\s*-?\s*(?:[0-9OISB]\s*){11}/gi,
    /HM\s*\/?\s*C\s*-?\s*(?:[0-9OISB]\s*){9}/gi,
  ];
  for (const pattern of markPatterns) {
    for (const match of ocrText.matchAll(pattern)) {
      const raw = match[0].trim();
      const normalized = normalizeMark(raw);
      if (normalized) {
        const clean = MARK_PATTERNS[normalized.type].test(raw.toUpperCase());
        push({ ...normalized, raw, confidence: clean ? 0.99 : 0.78 });
      }
    }
  }

  const huidPattern = /[A-Z0-9]{6}/gi;
  for (const match of ocrText.matchAll(huidPattern)) {
    const start = match.index ?? 0;
    const raw = match[0];
    if (!hasHuidContext(ocrText, start, start + raw.length)) continue;
    const normalised = raw.toUpperCase();
    if (MARK_PATTERNS.huid.test(normalised))
      push({ type: "huid", raw, normalised, confidence: 0.85 });
  }
  return results;
}

export function normaliseIsCode(value: string): string | null {
  const match = value.match(IS_CODE_PATTERN);
  if (!match) return null;
  return ("IS " + match[1] + (match[2] ? ":" + match[2] : "")).replace(/\s+/g, " ").toUpperCase();
}
