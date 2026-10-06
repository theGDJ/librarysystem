/* Database access.
 *
 * Two modes, selected by DATABASE_URL:
 *  - "postgres://…" / "postgresql://…"  → real PostgreSQL via pg.Pool (production)
 *  - "pglite://<dir>"                   → embedded, zero-install Postgres
 *    (PGlite / WASM) running inside this process; data persists under <dir>
 *    (default `.data/pglite`). Schema + seed are applied once by
 *    `npm run db:init` (auto-invoked via the `predev` hook).
 */
import { drizzle as drizzleNode, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __pramaanPgliteDb?: PgliteDatabase;
};

/** Both drivers expose the same Pg query API used across the app; the export
 * is typed as the node-postgres flavour routes were written against. */
let drizzleDb: NodePgDatabase | PgliteDatabase;
let pool: Pool | undefined;

if (databaseUrl.startsWith("pglite://")) {
  // `new PGlite()` is synchronous; queries queue internally until the WASM
  // backend reports ready, so module-load never needs a top-level await.
  if (!globalForDb.__pramaanPgliteDb) {
    const dir = databaseUrl.slice("pglite://".length) || ".data/pglite";
    const client = new PGlite(path.resolve(process.cwd(), dir));
    globalForDb.__pramaanPgliteDb = drizzlePglite(client);
  }
  drizzleDb = globalForDb.__pramaanPgliteDb;
} else {
  pool =
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({ connectionString: databaseUrl });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }
  drizzleDb = drizzleNode(pool);
}

export const db: NodePgDatabase = drizzleDb as NodePgDatabase;
export { pool };
