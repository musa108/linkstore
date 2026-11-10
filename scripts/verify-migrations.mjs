// Applies prisma/migrations/*/migration.sql in order to a DISPOSABLE database,
// seeds a legacy paid order between migrations to exercise the backfill, then
// checks that every scalar field in schema.prisma exists as a column (drift check).
// Usage: TEST_DATABASE_URL=postgresql://... node scripts/verify-migrations.mjs
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { Prisma } from '@prisma/client';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('Set TEST_DATABASE_URL to a disposable database');
if (/prod/i.test(url)) throw new Error('Refusing to run against a URL containing "prod"');

const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');

const dir = path.resolve('prisma/migrations');
const names = fs.readdirSync(dir).filter((n) => fs.statSync(path.join(dir, n)).isDirectory()).sort();
for (const [i, name] of names.entries()) {
  if (i === 1) {
    await client.query(`INSERT INTO "Store"("id","vendorId","name","slug","updatedAt") VALUES ('s1','v1','S','s',now())`);
    await client.query(`INSERT INTO "Order"("id","storeId","customerName","customerEmail","customerPhone","address","deliveryArea","deliveryFee","subtotal","total","status","paystackReference","updatedAt")
      VALUES ('o_paid','s1','A','a@a.com','0800','x','MAINLAND',1500,10000,11500,'PAID','ref_paid',now()),
             ('o_pend','s1','A','a@a.com','0800','x','MAINLAND',1500,10000,11500,'PENDING',NULL,now())`);
  }
  await client.query(fs.readFileSync(path.join(dir, name, 'migration.sql'), 'utf8'));
  console.log('applied', name);
}

const pay = (await client.query(`SELECT "orderId","reference","amountKobo","commissionKobo","merchantShareKobo" FROM "Payment"`)).rows;
console.log('backfilled payments:', JSON.stringify(pay));
if (pay.length !== 1 || pay[0].amountKobo !== 1150000 || pay[0].commissionKobo !== 57500) throw new Error('backfill wrong');

let missing = 0;
for (const model of Prisma.dmmf.datamodel.models) {
  const cols = new Set((await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name=$1`, [model.name])).rows.map((r) => r.column_name));
  for (const f of model.fields.filter((f) => f.kind === 'scalar' || f.kind === 'enum')) {
    if (!cols.has(f.name)) { console.error('MISSING COLUMN', model.name, f.name); missing++; }
  }
}
await client.end();
if (missing) process.exit(1);
console.log('OK: migrations apply cleanly, backfill correct, no schema drift');
