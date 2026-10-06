# Pramaan redesign notes

## Direction
"The register": Pramaan reads like a reference publication. Ivory paper, navy ink, teal only for the
reader's current selection, amber only where a Quality Control Order makes certification compulsory.
Structure comes from rules, margins and type — no gradients, glass, glows, floating cards or
scroll-triggered animation.

## Design system (`src/app/globals.css`)
- Tokens: `canvas`, `surface`, `sunken`, `rule`, `ink`, `body`, `muted`, `select*`, `attention*`,
  `ok*`, `danger*` (one added error colour; everything else derives from the brief's palette).
- Type: Manrope (headings), Inter (interface and reading), Noto Sans Devanagari (Hindi),
  JetBrains Mono for IS codes, clause and licence numbers only. 15px body, ~1.25 scale.
- Radii: 2px tags, 6px controls, 10px sheets. Global `:focus-visible` ring; reduced motion respected.
- Components: `.btn*`, `.field`, `.tag*`, `.choice`, `.sheet`, `.reading`, `.id`, evidence tiers `.ev-*`.

## Evidence tiers (used on every page)
| Tier | Marker | Source |
|---|---|---|
| Catalogue record | solid navy rule | rendered directly from DB rows |
| Knowledge-base extract | teal rule | quoted article text / curated profile |
| Model summary | dashed slate rule | on-server LLM prose |

The assistant splits each stored answer into these tiers client-side (`src/lib/answer-parse.ts`);
the API response and stored messages are unchanged.

## Pages
- `/` editorial hero with a three-mode search (ask / identify / search) and a live catalogue record.
- `/assistant` research workspace: questions as headings, tiered answer body, numbered sources that
  expand into the record (fetched from existing `/api/standards` and `/api/labs`), follow-ups,
  retry on failure, conversation restored from `GET /api/chat`.
- `/standards` filterable catalogue, URL-synced, "matched in" reasons, preview pane on wide screens.
- `/standards/[code]` **new** reference page (read-only DB queries): scope, obligation, clauses,
  related standards, testing, certification route.
- `/finder` five-stage compliance pathway; unmatched queries now show the keyword matches the API
  already returned.
- `/labs`, `/certification` (`?scheme=` deep links, `#documents`), `/consumer`, `/dashboard` restyled.

## Behaviour changes worth knowing
- The assistant no longer auto-sends "hello" on load (it polluted recent queries and analytics);
  an empty-state introduction replaces it. Greeting rows from older sessions are filtered from the
  recent list.
- Fixed: assistant sidebar links did nothing (same-route navigation); clause lines rendered as raw
  "- Clause" text; deep links re-asked on reload.
- Demo data is labelled: lab contacts "illustrative", licence lookups "Demo registry".
- `scripts/db-init.ts` creates `.data/` on a fresh clone (first run previously failed).
- `frontend/` (a stale duplicate of `src/`) is excluded from `tsc` and ESLint.

## Unchanged
API routes, engine, retriever, LLM integration, DB schema, seeds, environment config.
Follow-up suggestions are not stored by the API, so they appear only on live answers.

## Embedded model finding
With the default Gemma 3 270M model installed, the engine's sanity guard rejected the model's prose on
every question tried (7/7), so answers fall back to catalogue records only — the engine's designed
behaviour. The model-summary layer was verified by replaying a response in the engine's exact format
through the real UI. For model summaries to appear in practice, set `AI_MODEL_URL` to a larger
instruct GGUF, as ARCHITECTURE.md recommends.

## Verification
`npm run lint`, `npm run typecheck`, `npm run build` pass. axe-core (WCAG 2 A/AA) reports no
violations on any page. Flows tested in Chromium at 1440px and 390px: deep link, restore,
follow-up, error and retry, standards preview, finder pathway, certification deep link,
and live English and Hindi questions with the embedded model loaded.
