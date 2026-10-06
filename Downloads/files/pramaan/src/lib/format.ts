/* Shared, framework-free helpers used by server and client components. */

/** Route for a standard's reference page. Codes contain spaces and colons. */
export function standardHref(code: string): string {
  return `/standards/${encodeURIComponent(code)}`;
}

/** Decode a route segment back to the catalogue code, tolerating double-encoding. */
export function codeFromParam(param: string): string {
  let out = param;
  for (let i = 0; i < 2; i++) {
    try {
      const next = decodeURIComponent(out);
      if (next === out) break;
      out = next;
    } catch {
      break;
    }
  }
  return out;
}

/**
 * Map a catalogue `scheme` string (free text such as "ISI Mark (Scheme-I)",
 * "Compulsory Registration Scheme (CRS)") to a walkthrough id on
 * /certification. Returns null when no walkthrough fits.
 */
export function certificationIdForScheme(scheme: string | null | undefined): string | null {
  const s = (scheme ?? "").toLowerCase();
  if (!s) return null;
  if (s.includes("crs") || s.includes("compulsory registration")) return "crs";
  if (s.includes("hallmark")) return "hallmark";
  if (s.includes("fmcs") || s.includes("foreign")) return "fmcs";
  if (s.includes("scheme-iv") || s.includes("conformity")) return "coc";
  if (s.includes("isi") || s.includes("scheme-i")) return "isi";
  if (s.includes("voluntary") || s.includes("eco")) return "eco";
  return null;
}

/** Finder profile scheme ids → certification walkthrough ids. */
export const PROFILE_SCHEME_TO_CERT: Record<string, string> = {
  scheme1: "isi",
  scheme2: "crs",
  hallmark: "hallmark",
  scheme4: "coc",
  voluntary: "eco",
};

export const CATEGORY_LABEL: Record<string, string> = {
  construction: "Construction",
  electrical: "Electrical",
  electronics: "Electronics and IT",
  hallmark: "Hallmarking",
  food: "Food and water",
  plastics: "Plastics",
  mechanical: "Mechanical",
  consumer: "Consumer goods",
  chemicals: "Chemicals",
  services: "Management systems",
};

export function categoryLabel(id: string): string {
  return CATEGORY_LABEL[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

export function formatCount(n: number): string {
  return n.toLocaleString("en-IN");
}

export function plural(n: number, one: string, many: string): string {
  return `${formatCount(n)} ${n === 1 ? one : many}`;
}
