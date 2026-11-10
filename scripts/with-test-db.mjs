// Starts a disposable embedded Postgres, runs the full test suite against it, then stops it.
// Usage: npm run test:db   (needs devDependency `embedded-postgres`; Postgres refuses to run as root,
// so in containers the script asks embedded-postgres to create a non-root user.)
import EmbeddedPostgres from "embedded-postgres";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "linkstore-pg-"));
const port = 54000 + Math.floor(Math.random() * 900);
const pg = new EmbeddedPostgres({ databaseDir: dir, user: "postgres", password: "pw", port, persistent: false, createPostgresUser: process.getuid?.() === 0 });
let code = 1;
try {
  await pg.initialise(); await pg.start(); await pg.createDatabase("linkstore_test");
  const r = spawnSync("npx", ["vitest", "run", ...process.argv.slice(2)], { stdio: "inherit", env: { ...process.env, TEST_DATABASE_URL: `postgresql://postgres:pw@localhost:${port}/linkstore_test` } });
  code = r.status ?? 1;
} finally { await pg.stop().catch(() => {}); fs.rmSync(dir, { recursive: true, force: true }); }
process.exit(code);
