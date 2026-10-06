/* Schema DDL shared by the in-process PGlite bootstrap (src/db/index.ts) and
 * the optional socket server (scripts/pg-server.mjs). drizzle-kit push remains
 * the proper migration path for real PostgreSQL deployments. */
export const DDL = `
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
