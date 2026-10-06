# PRAMAAN — Code Architecture Report

**App:** AI assistant for Indian Standards & BIS services
**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · PostgreSQL + Drizzle ORM · **embedded LLM: node-llama-cpp (llama.cpp) running a local GGUF model** · framer-motion · lucide-react

```
Browser (React clients)
   │  fetch
   ▼
Next.js API routes  (/api/chat, /api/finder, /api/standards, /api/labs,
   │                /api/verify, /api/complaints, /api/stats, /api/health)
   ▼
lib/assistant/engine.ts  ── the AI brain (retrieve facts → LLM composes → cite)
   │            └── lib/assistant/retriever.ts (query → DB fact sheet)
   │            └── lib/assistant/llm.ts       (embedded GGUF model, llama.cpp)
   │            └── lib/assistant/products.ts  (20 product-family profiles)
   │            └── lib/i18n.ts                (EN/HI locale detection + UI strings)
   ▼
db/index.ts (pg Pool + Drizzle)  →  PostgreSQL (app_db)
```

**Quick start:** `npm install` → copy `.env.example` to `.env` → `npm run model:download`
(fetches the embedded GGUF model, no API keys needed) → `npm run dev`
(the `predev` hook auto-applies schema + seed to the embedded PGlite database on
first run; for a real PostgreSQL server set a `postgres://…` DATABASE_URL and run
`npm run db:push && npm run db:seed`).
Optional: `npm run ai:warmup` pre-loads the model so the first chat is fast.


---

## 1. Data layer — `src/db/`

### `src/db/index.ts` — connection
- Reads `DATABASE_URL` from `.env` (throws if missing).
- Creates a `pg.Pool` and wraps it with `drizzle(pool)`.
- On `NODE_ENV=development` the pool is cached on `globalThis` so Next.js hot reloads don't leak connections.

### `src/db/schema.ts` — 7 tables (Drizzle `pgTable`)

| Table | Purpose | Notable columns |
|---|---|---|
| `standards` | The Indian Standards catalogue | `code` (unique, e.g. "IS 456:2000"), `category`, `mandatory` (QCO flag), `scheme`, `qco`, `keywords text[]`, `sections jsonb` (clause/title/summary list), `related text[]`, `editions` |
| `knowledge_docs` | Scheme/process/FAQ knowledge articles | `slug` (unique), `kind` (scheme/process/faq/consumer/fees/hallmark/labs/concept), `body`, `body_hi` (Hindi), `keywords`, `refs jsonb` (citations) |
| `labs` | BIS + recognized testing labs & AHCs | `kind` ("BIS Laboratory" / "Recognized Laboratory" / "AHC"), `capabilities text[]`, `standards text[]` |
| `licences` | Demo verification registry | `mark_no` (unique: CM/L-, R-, HM/C-, or 6-char HUID), `type` (isi/crs/jeweller/huid), `status` (valid/suspended/expired) |
| `chat_sessions` | One row per conversation | `id uuid default random()`, `locale` |
| `chat_messages` | Full transcript | `session_id → chat_sessions (cascade)`, `role` (user/assistant), `content`, `intent`, `citations jsonb` |
| `complaints` | Consumer grievance tickets | `ticket` (BISC-YYYY-######), `name`, `email`, `category`, `product`, `description` |

Indexes: `standards(category)`, `standards(mandatory)`, `docs(kind)`, `labs(state)`.

### `src/db/seed.ts` — knowledge base loader
Run with `npx tsx --env-file=.env src/db/seed.ts`. It deletes all four content tables then inserts:
- **1,971 standards** — each with summary, keyword array (incl. Hindi Devanagari terms like "सीमेंट", "सरिया"), key clause sections, related standards. Authored through the block DSL in `seed-kit.ts`; waves 4–7 are legacy object literals and waves 8–16 are block-built files covering construction, electrical, electronics/CRS, mechanical, chemicals, plastics, food, consumer and management systems.
- **29 knowledge docs** — bilingual (EN + HI) explainers for schemes, QCOs, hallmarking, fees, consumer verification.
- **394 labs** — 41 BIS laboratories, 277 recognized labs (CSIR/STQC/CPRI/regional test houses) and 76 Assaying & Hallmarking Centres across all 36 states and UTs, with capability categories and the standards each tests.
- **56 licences** — demo registry entries across all four mark types (ISI, CRS, jeweller, HUID), including deliberately *suspended* and *expired* ones so the verifier shows realistic statuses.

`scripts/validate-data.ts` is the integrity gate for the catalogue: category whitelist, ≥3 keywords, at least one populated clause section, resolvable `related` codes, globally unique IS codes, licence mark-number regexes and Drizzle-shape checks. Run it with a `DATABASE_URL` in the environment (the seed module imports the DB client).

---

## 2. Intelligence layer — `src/lib/`

### `src/lib/i18n.ts` — bilingual support
- `Locale = "en" | "hi"`; `UI` dictionary maps ~16 UI keys per language.
- `t(locale, key)` with English fallback.
- `detectLocale(text)`: if the query contains any Devanagari codepoint (`\u0900-\u097F`) → Hindi. This is how the bot auto-replies in the language of the question.

### `src/lib/assistant/products.ts` — product → standard mapping
- 20 hard-coded `ProductProfile`s: cement, TMT steel, gold, silver, IT electronics, batteries, cables, plugs/switches, fans, LED lamps, helmets, pressure cookers, packaged water, pipes, toys, LPG cylinders/stoves, energy meters, MCBs/RCCBs, fire extinguishers, plywood, masks.
- Each profile: bilingual label, `aliases` (English + Hindi: "tmt", "सरिया", "saria"…), `category`, the applicable IS codes, `scheme` (scheme1/scheme2/hallmark/scheme4/voluntary), `mandatory` flag, and a bilingual regulatory note.
- `matchProducts(query)`: lowercases the query, scans every alias as a substring; aliases longer than 4 chars score 3, shorter score 2; returns the **top 3 profiles** by score. This powers both the Finder page and the assistant's product enrichment.

### `src/lib/assistant/engine.ts` — the assistant brain (embedded-model edition)
The assistant is powered by a **language model embedded in the server process** — a GGUF file executed with llama.cpp (`node-llama-cpp`). There is **no cloud LLM API**: no keys, no per-token cost, no data leaving the box. The shipped default is *Gemma 3 270M (Q4_K_M, ~241 MB)* — deliberately small so it runs on any CPU; `AI_GGUF_PATH`/`AI_MODEL_URL` can swap in any instruct-tuned GGUF (Qwen2.5-0.5B-Instruct, SmolLM2-360M, Llama-3.2-1B, …) for richer prose.

**Pipeline** (`answer(query, localeHint)`):
1. **Locale detection** — `detectLocale()` on the raw query (Devanagari → Hindi).
2. **Retrieval** (`retriever.ts`) — distils the query into a numbered **fact sheet**:
   - IS-code patterns (`IS 456:2000`, `is-694`, `आईएस 2347`) trigger exact catalogue lookups;
   - scored full-text over standard titles/summaries/keywords (token frequency, +0.5 if mandatory);
   - product-alias profiles (`products.ts`) pull their DB standard rows + lab categories;
   - keyword-scored knowledge-doc search with intent-based kind boosts (fees/hallmark/process/…);
   - labs scored by product category + token overlap.
   Emits `{ standards, docs, labs, profiles, factLines[], citations[] }`.
3. **Model generation** (`llm.ts`) — the LLM is prompted with the fact lines (`TASK … FACTS … Question … Answer`; 96 max tokens, temperature 0.25, repetition/frequency penalties) — never raw table dumps. `sanitiseCompletion()` guards output quality: cuts prompt echoes, stops at the first repeated line (loop detection), caps bullets, and judges whether the prose is usable.
4. **Deterministic payload blocks** — standard codes/titles/schemes, the first two key clauses, and lab cards are rendered **straight from DB rows** and appended to the model's prose: displayed facts are exact data, and citations always map to retrieved rows. If the model file is missing (`npm run model:download` not run) or its prose fails the sanity check, the answer is still fully formed from these blocks.
5. **Result** — `{ intent, text (markdown), citations[], suggestions[], locale }`, the same contract as before, so `ChatClient`, session logging and the Insights dashboard are unchanged. The `intent` (lightweight keyword classifier) is kept purely for analytics and suggestion chips.

**Why model prose + deterministic payload?** the default 270 M model is good at short paraphrasing but weak at long recall. Scoping its job to *compose* while the app renders *facts* keeps every citation true — and swapping in a larger instruct model (one env var) upgrades the prose with zero code changes.

### `src/lib/assistant/retriever.ts` — query → fact sheet
- `standardsByCodeFragment(fragment)` — `LIKE '%fragment%'` on the `code` column.
- `fullTextStandards(query)` — Unicode-aware tokenizer (words > 2 chars, max 6), OR-match across `lower(title)`, `lower(summary)`, `lower(array_to_string(keywords,' '))`, re-scored in JS by token frequency (+0.5 if mandatory); top 4.
- `relevantDocs(query)` — token-overlap scoring over knowledge-doc title/keywords/body, with kind boosts per intent hints (fees/hallmark/process/labs/consumer/concept); top 3.
- `labsFor(categories, tokens)` — +4 per matching capability, +1 per token hit; top 3.
- `profileFact/stdFact/docFact/labFact` — render each row as one compact numbered fact line (`[i] …`), size-capped, markdown stripped; these lines are the **only** grounding the LLM receives, and every emitted line maps to a citation.

---

## 3. API layer — `src/app/api/` (all routes `force-dynamic`)

### `POST /api/chat` — assistant endpoint
1. Parse body: `message` (trim, reject empty or > 2000 chars → 400), optional `sessionId`, `locale`.
2. No session? Insert a `chat_sessions` row and return its UUID.
3. Insert the **user** message.
4. Call `answer(message, locale)` → engine result.
5. Insert the **assistant** message with `intent` and `citations` (this powers the Insights dashboard).
6. Return `{ sessionId, intent, text, citations, suggestions }`.

`GET /api/chat?sessionId=…` returns the session's last 50 messages (fetched desc, reversed to chronological) — used to restore conversations.

### `POST /api/finder` — product identification
1. `matchProducts(query)` → profiles.
2. **Matched:** for each profile, select its standards from the DB (joining on the number fragment of the IS code), pick up to 6 labs whose `capabilities` include the profile's category, and attach `PROCESS_STEPS[scheme]` (hard-coded step lists for scheme1/scheme2/hallmark/scheme4) plus a timeline estimate.
3. **Not matched:** tokenize the query (max 4 words > 2 chars), `ILIKE` fallback across `code`/`title`, return up to 6 raw standards with `matched: false`.

### `GET /api/standards` — catalogue search
- Query params: `q`, `category`, `mandatory=true`, `code`.
- Builds AND-combined conditions; for each `q` token an OR across `code ILIKE`, `title ILIKE`, `summary ILIKE` and a Postgres `EXISTS (SELECT 1 FROM unnest(keywords) k WHERE lower(k) LIKE …)` against the keyword array.
- **Weighted ranking in JS:** code hit +8, title +5, keyword +4, summary +1 (QCO text +2), mandatory +0.5. No query → alphabetical by code. Limit 250.

### `GET /api/labs` — lab directory
- Loads up to 1,000 labs ordered by state/city, filters by `state`/`kind`/`capability`/`q` (name, city or state substring) in JS, and also returns the distinct state list for the dropdown plus `total` and per-`kind` counts.

### `POST /api/verify` — licence / HUID checker
- Uppercases the input, requires ≥ 4 chars, `ILIKE '%number%'` over `licences.mark_no`, returns up to 3 hits with full registry rows (holder, product, standard, status, validity, city) or `{ found: false }`.

### `POST /api/complaints` — grievance filing
- Validates name, email contains "@", product, and description ≥ 20 chars → otherwise 400.
- Generates ticket `BISC-<year>-<6 random digits>`, inserts, returns the ticket.

### `GET /api/stats` — dashboard feed
- Counts: standards, mandatory standards, labs, licences, assistant answers, complaints.
- Intent histogram (`GROUP BY intent` on assistant messages), category histogram.
- **Top cited standards:** scans the last 200 assistant messages' `citations` jsonb, tallies `kind === "standard"` refs, top 6.
- 7 most recent user queries.

### `GET /api/health`
- `SELECT 1` via Drizzle → `{ ok: true }` or 500.

---

## 4. UI layer — `src/app/` + `src/components/`

### Shell
- **`layout.tsx`** — loads three Google fonts via `next/font`: Fraunces (display serif), Space Grotesk (UI), JetBrains Mono (code/labels); sets metadata and the dark `ink-950` body.
- **`Chrome.tsx`** — `Nav` (fixed glass pill header, active-route highlight via `usePathname`, mobile hamburger), `Footer` (branding, links, SIH disclaimer), `PageShell` (kicker + title + blueprint-grid/glow backdrop for inner pages).
- **`motion.tsx`** — `Reveal` (framer-motion `whileInView` blur+rise entrance with stagger index) and `AskBar` (hero search that routes to `/assistant?q=<query>`).

### Pages
| Route | Type | What it does |
|---|---|---|
| `/` (home) | Server | Hero + AskBar, preset question chips, **live DB stat tiles** (1,971 IS / 588 mandatory / 394 labs / 56 marks / N answered), 8-service grid, 3-step "how answers are built", 4 scheme cards, bilingual CTA |
| `/assistant` | Server shell + `ChatClient` | The chat app (below) |
| `/finder` | Server shell + `FinderClient` | Product → standard wizard (below) |
| `/standards` | Server shell + `StandardsClient` | Catalogue explorer: 180 ms-debounced search with `AbortController` cancellation, category chips, mandatory-only toggle, list + **detail drawer** (clauses, related, editions) |
| `/labs` | Server shell + `LabsClient` | Directory: state / type / capability dropdowns → `/api/labs`, cards with contacts and tested standards |
| `/guide` | Server | Permanent redirect to `/certification` (keeps old links working) |
| `/certification` | Server shell + `CertificationClient` | The certification guide: six scheme walkthroughs (Scheme-I ISI, CRS, FMCS, Hallmarking, Scheme-IV CoC, voluntary/ECO), a persona × product route recommender, step rails, printable document checklists (localStorage via `useSyncExternalStore`), indicative fee tables, marking rules, a five-route comparison matrix, a readiness checker, live QCO chips and an FAQ — with live counts and deep links into `/standards`, `/labs` and `/assistant` |
| `/consumer` | Client | **Verify card** (POST /api/verify, sample numbers, status colour chips: valid/suspended/expired) + **complaint form** (POST /api/complaints → animated ticket confirmation) + helpline 1915 info |
| `/dashboard` | Server | Insights: six count tiles, intent bar chart (CSS widths), category donut (SVG), top-cited standards, recent queries — all live from `/api/stats` data computed server-side |

### `ChatClient.tsx` — the chat experience
- **Markdown-lite renderer** (hand-rolled, zero deps): `**bold**`, `_italic_`, `- bullets` (gold square markers), `1. numbered` (mono number badges), `---` separators, paragraphs. Deliberately avoids a markdown library to keep the bundle tiny and styling consistent with the design system.
- **State:** `messages[]`, `input`, `locale`, `busy`, `sessionId`. Session id is persisted in `localStorage` (`pramaan_session`) so refreshes restore the conversation (via GET /api/chat).
- **On mount:** reads `?q=` from the URL (this is how the home AskBar deep-links a question) and sends it, otherwise sends "hello"/"नमस्ते" to trigger the greeting.
- **`send()`** — POSTs `{ message, sessionId, locale }`, appends user + assistant messages, stores the returned sessionId; a `sendingRef` guard prevents double-submits; Enter sends (Shift+Enter = newline); auto-scroll to bottom; network failure → inline error bubble.
- **Citation chips** — each assistant message lists its citations with an icon per kind (BookMarked = standard, FileText = doc, FlaskConical = lab), the ref in gold, truncated label, optional clause.
- **Suggestions** — the latest assistant message's `suggestions[]` render as clickable "Ask next" chips.
- **Toolbar** — EN/हिंदी toggle (switches UI strings via `t()`) and "New conversation" (clears state + localStorage).

### `FinderClient.tsx` — product wizard
- Preset chips (10 examples incl. one Hindi: "इस्पात सरिया") or free text → POST /api/finder.
- **Matched:** animated verdict panel — product name, note, MANDATORY·QCO (coral) or VOLUNTARY (jade) chip, scheme chip, timeline; two-column grid: applicable standards (from DB, with summaries) | numbered certification-path timeline; labs that test this family (cards with kind + city + standards).
- **Not matched:** amber warning panel suggesting concrete product names.
- Framer-motion `AnimatePresence` transitions between states.

### `globals.css` — design system (Tailwind v4)
- Custom palettes: `ink` (near-black surfaces), `gold` (brand accent), `ash` (text greys), `jade`/`coral` (status).
- Reusable component classes: `.panel`, `.panel-flat`, `.chip` (+ gold/jade/coral variants), `.btn-gold`, `.btn-ghost`, `.kicker`, `.mono`, `.card-hover`, plus the `.blueprint` grid and `.glow-gold` background effects.

---

## 5. End-to-end walkthrough

**"Is ISI mark mandatory for helmets?"** — typed in the chat:

1. `ChatClient.send()` POSTs to `/api/chat`.
2. Route validates and stores the user message; no session existed → a `chat_sessions` row is created, its UUID returned and cached in localStorage.
3. Engine: `detectLocale(…)` → `en` (no Devanagari); `classifyLite()` → `scheme` (for analytics/suggestions).
4. `retrieve()`: the `helmet` product profile maps to IS 4151:2015 → its DB row is pulled; the `scheme` keyword hints boost the scheme knowledge docs → fact lines are composed.
5. The embedded model (llama.cpp + GGUF, in-process) receives the `[1]…[n]` fact lines + the question and writes 1–3 sentences.
6. Deterministic payload blocks append the exact IS 4151:2015 row (title, mandatory flag, scheme, key clauses) plus lab cards.
7. Route stores the assistant message with `intent` + `citations` (`scheme-isi` doc + `IS 4151:2015` standard).
8. Client renders markdown + citation chips + "Ask next" suggestions.

**"I make pressure cookers"** on the Finder:
`matchProducts` → `cooker` profile → `/api/finder` joins IS 2347:2017 from the DB, filters labs by `consumer` capability, attaches the 6-step Scheme-I path and "≈ 30–90 days" timeline → the UI animates in the verdict, standards, path and labs panels.

---

## 6. Design decisions & known limits

**Why an embedded model, and why Gemma 3 270M by default?** The brief was "an AI model built into the app, no API". `node-llama-cpp` gives in-process llama.cpp inference with prebuilt CPU binaries served from npm, so nothing external is needed at install or runtime. Weights are fetched by `scripts/download-model.mjs` from PyPI chunk packages (`gemma3-270m-q4-k-m-gguf-part1..4`) — chosen because PyPI is reachable from restricted build sandboxes where huggingface.co is not; `AI_MODEL_URL` accepts any direct GGUF URL (e.g. Hugging Face) for a quality upgrade to an instruct model such as Qwen2.5-0.5B-Instruct.

**Trade-offs of a 270M default:** latency is a few hundred ms per answer on 2 CPU cores and RAM stays ≈0.7 GB, but prose is short and foreign-language (Hindi) generation is weak — the app instructs Devanagari replies, and falls back to English data blocks when the prose fails the sanity guard. Production deployments should set `AI_MODEL_URL` to an instruct GGUF; the fact-sheet pipeline, sanity guard and deterministic payloads are model-agnostic and keep citations exact either way.

**Known limits (prototype scope):**
- Answers are single-turn (the model sees only the current question); conversation history is stored for the UI but not yet fed back into the prompt.
- Retrieval is `LIKE`/substring based, not true full-text or vector search — long natural-language queries may miss; ranking heuristics compensate.
- Product coverage is 20 curated families; unknown products fall back to token search or a graceful "cannot map".
- The licence registry is **demo data** — real verification needs the official BIS API/registry.
- `relevantDocs` and `labsFor` load full tables and filter in JS — fine at this scale (29 docs / 394 labs), would need SQL filtering at production scale.
- `/api/chat` GET returns messages without auth — session UUIDs are the only access control, acceptable for a demo, not for production PII.
