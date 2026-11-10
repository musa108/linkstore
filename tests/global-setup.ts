import fs from "node:fs";
import path from "node:path";
import pg from "pg";

/**
 * Integration tests need a DISPOSABLE Postgres: set TEST_DATABASE_URL.
 * The schema is rebuilt from prisma/migrations (so migrations are tested too).
 * Without it, integration suites are skipped and only unit tests run.
 */
export default async function setup() {
    const url = process.env.TEST_DATABASE_URL;
    if (!url) { console.warn("[tests] TEST_DATABASE_URL not set – integration tests will be skipped"); return; }
    if (/prod/i.test(url)) throw new Error("Refusing to run tests against a URL containing 'prod'");
    const c = new pg.Client({ connectionString: url });
    await c.connect();
    await c.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    const dir = path.resolve("prisma/migrations");
    for (const n of fs.readdirSync(dir).filter((x) => fs.statSync(path.join(dir, x)).isDirectory()).sort()) {
        await c.query(fs.readFileSync(path.join(dir, n, "migration.sql"), "utf8"));
    }
    await c.end();
}
