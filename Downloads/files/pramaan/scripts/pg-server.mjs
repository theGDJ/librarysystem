/* Local WASM-Postgres wire server used to run/verify the seed without an
   external PostgreSQL install. Not part of the app runtime — it only exists
   so the seeded knowledge base can be exercised end-to-end in a sandbox.

     node scripts/pg-server.mjs            # serves 127.0.0.1:5432, persists to .data/
     DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/app_db npx tsx src/db/seed.ts
*/
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, ".data", "pglite");
await mkdir(dataDir, { recursive: true });

const db = await PGlite.create(dataDir);
const server = new PGLiteSocketServer({ db, port: 5432, host: "127.0.0.1" });
await server.start();
console.log(`pglite socket server listening on 127.0.0.1:5432 (data: ${dataDir})`);

const DDL = `
CREATE TABLE IF NOT EXISTS standards (
  id serial PRIMARY KEY,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'current',
  mandatory boolean NOT NULL DEFAULT false,
  scheme text NOT NULL DEFAULT 'Voluntary',
  qco text,
  summary text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  related text[] NOT NULL DEFAULT '{}',
  editions integer NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS knowledge_docs (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  body_hi text,
  keywords text[] NOT NULL DEFAULT '{}',
  refs jsonb NOT NULL DEFAULT '[]'::jsonb
);
CREATE TABLE IF NOT EXISTS labs (
  id serial PRIMARY KEY,
  name text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  kind text NOT NULL,
  capabilities text[] NOT NULL DEFAULT '{}',
  standards text[] NOT NULL DEFAULT '{}',
  phone text,
  email text
);
CREATE TABLE IF NOT EXISTS licences (
  id serial PRIMARY KEY,
  mark_no text NOT NULL UNIQUE,
  type text NOT NULL,
  holder text NOT NULL,
  product text NOT NULL,
  standard_code text,
  status text NOT NULL DEFAULT 'valid',
  issued_on text NOT NULL,
  valid_till text NOT NULL,
  city text NOT NULL
);
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  locale text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id serial PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  intent text,
  citations jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS complaints (
  id serial PRIMARY KEY,
  ticket text NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL,
  category text NOT NULL,
  product text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'registered',
  created_at timestamptz NOT NULL DEFAULT now()
);
`;
await db.exec(DDL);
console.log("schema ready");

const { rows } = await db.query("select count(*)::int as n from standards");
if (Number(rows[0].n) === 0) {
  console.log("standards table empty — running seed…");
  await new Promise((resolve, reject) => {
    const child = spawn("npx", ["tsx", "src/db/seed.ts"], {
      cwd: root,
      env: { ...process.env, DATABASE_URL: "postgres://postgres:postgres@127.0.0.1:5432/app_db" },
      stdio: "inherit",
    });
    child.on("exit", (code) => (code === 0 ? resolve(undefined) : reject(new Error(`seed exited ${code}`))));
  });
}

process.on("SIGTERM", async () => {
  await server.stop();
  process.exit(0);
});
setInterval(() => {}, 1 << 30);
