/* One-shot bootstrap for development/demo databases.
 *
 * - pglite://…  : applies the DDL and seeds the knowledge base if empty.
 * - postgres://…: checks the connection and reports whether tables are seeded
 *                 (schema itself comes from `npm run db:push` / db:seed).
 */
import "dotenv/config";
import { DDL } from "../src/db/ddl";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("pglite://")) {
    const dir = url.slice("pglite://".length) || ".data/pglite";
    // PGlite creates the data directory but not its parents (.data/ on a fresh clone)
    const { mkdirSync } = await import("node:fs");
    const { dirname } = await import("node:path");
    mkdirSync(dirname(dir), { recursive: true });
    const { PGlite } = await import("@electric-sql/pglite");
    const path = await import("node:path");
    const client = new PGlite(path.resolve(process.cwd(), dir));
    await client.waitReady;
    await client.exec(DDL);
    const { rows } = await client.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM standards",
    );
    if (Number(rows[0].n) === 0 && process.env.AUTO_SEED !== "0") {
      const { seed } = await import("../src/db/seed");
      const { drizzle } = await import("drizzle-orm/pglite");
      await seed(drizzle(client) as never);
    } else {
      console.log("[db:init] pglite already seeded, nothing to do.");
    }
    await client.close();
    console.log("[db:init] done.");
    return;
  }

  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const res = await client.query(
    "SELECT to_regclass('standards') IS NOT NULL AS exists",
  );
  if (res.rows[0].exists) {
    const c = await client.query<{ n: string }>(
      "SELECT count(*)::int AS n FROM standards",
    );
    console.log(`[db:init] postgres reachable; standards rows: ${c.rows[0].n}`);
  } else {
    console.log("[db:init] postgres reachable; schema missing — run `npm run db:push && npm run db:seed`.");
  }
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
