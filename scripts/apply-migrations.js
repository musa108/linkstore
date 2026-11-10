/**
 * Manual migration script – applies the two pending migrations in order.
 * Uses sequential single-statement queries with reconnect on ECONNRESET.
 */
require("dns").setDefaultResultOrder("ipv4first");
const { Client } = require("pg");
require("dotenv").config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

async function getClient() {
  const client = new Client({ connectionString, connectionTimeoutMillis: 30000 });
  await client.connect();
  return client;
}

async function safeQuery(client, sql, params) {
  try {
    const result = await client.query(sql, params);
    return result;
  } catch (e) {
    throw e;
  }
}

async function run() {
  let client = await getClient();
  console.log("✅ Connected");

  const { rows: existing } = await safeQuery(client, `SELECT tablename FROM pg_tables WHERE schemaname='public'`);
  const tables = new Set(existing.map((r) => r.tablename));
  console.log("Existing tables:", [...tables].join(", "));

  const { rows: orderCols } = await safeQuery(client, `SELECT column_name FROM information_schema.columns WHERE table_name='Order' AND table_schema='public'`);
  const orderColumns = new Set(orderCols.map((r) => r.column_name));
  console.log("Order columns include currency?", orderColumns.has("currency"));

  // Helper: reconnect and retry once on ECONNRESET
  async function exec(label, sql, params) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await client.query(sql, params);
        console.log(`  ✅ ${label}`);
        return;
      } catch (e) {
        if ((e.code === "ECONNRESET" || e.message.includes("ECONNRESET")) && attempt < 2) {
          console.log(`  ⚡ Reconnecting (attempt ${attempt + 1})...`);
          try { await client.end(); } catch {}
          client = await getClient();
          continue;
        }
        if (e.message.includes("already exists") || e.code === "42P07" || e.code === "42701") {
          console.log(`  ⏭  ${label} (already exists)`);
          return;
        }
        console.error(`  ❌ ${label}: ${e.message}`);
        throw e;
      }
    }
  }

  // ================================================================
  // MIGRATION 1
  // ================================================================
  console.log("\n--- MIGRATION 1: payments_chat_integrity ---");

  if (!orderColumns.has("currency"))
    await exec("Order.currency", `ALTER TABLE "Order" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'NGN'`);
  else console.log("  ⏭  Order.currency already exists");

  if (!orderColumns.has("idempotencyKey"))
    await exec("Order.idempotencyKey", `ALTER TABLE "Order" ADD COLUMN "idempotencyKey" TEXT`);
  else console.log("  ⏭  Order.idempotencyKey already exists");

  await exec("Index Order_idempotencyKey_key", `CREATE UNIQUE INDEX IF NOT EXISTS "Order_idempotencyKey_key" ON "Order"("idempotencyKey")`);
  await exec("Index Order_storeId_createdAt_idx", `CREATE INDEX IF NOT EXISTS "Order_storeId_createdAt_idx" ON "Order"("storeId","createdAt")`);
  await exec("Index Order_storeId_status_idx", `CREATE INDEX IF NOT EXISTS "Order_storeId_status_idx" ON "Order"("storeId","status")`);
  await exec("Index Order_customerEmail_idx", `CREATE INDEX IF NOT EXISTS "Order_customerEmail_idx" ON "Order"("customerEmail")`);
  await exec("Index Product_storeId_inStock_idx", `CREATE INDEX IF NOT EXISTS "Product_storeId_inStock_idx" ON "Product"("storeId","inStock")`);
  await exec("Index ProductMedia_productId_order_idx", `CREATE INDEX IF NOT EXISTS "ProductMedia_productId_order_idx" ON "ProductMedia"("productId","order")`);
  await exec("Index OrderItem_orderId_idx", `CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId")`);
  await exec("Index OrderItem_productId_idx", `CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx" ON "OrderItem"("productId")`);
  await exec("Index Variant_productId_idx", `CREATE INDEX IF NOT EXISTS "Variant_productId_idx" ON "Variant"("productId")`);
  await exec("Index Review_productId_createdAt_idx", `CREATE INDEX IF NOT EXISTS "Review_productId_createdAt_idx" ON "Review"("productId","createdAt")`);
  await exec("Index Review_orderId_productId_key", `CREATE UNIQUE INDEX IF NOT EXISTS "Review_orderId_productId_key" ON "Review"("orderId","productId")`);

  if (!tables.has("Payment")) {
    await exec("CREATE Payment", `
      CREATE TABLE "Payment" (
        "id" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "provider" TEXT NOT NULL DEFAULT 'PAYSTACK',
        "reference" TEXT NOT NULL,
        "amountKobo" INTEGER NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'NGN',
        "status" TEXT NOT NULL DEFAULT 'INITIALIZED',
        "commissionBps" INTEGER NOT NULL,
        "commissionKobo" INTEGER NOT NULL,
        "merchantShareKobo" INTEGER NOT NULL,
        "subaccountCode" TEXT,
        "providerTransactionId" TEXT,
        "failureReason" TEXT,
        "paidAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Payment_amount_positive" CHECK ("amountKobo" > 0),
        CONSTRAINT "Payment_split_consistent" CHECK ("commissionKobo" + "merchantShareKobo" = "amountKobo")
      )`);
    await exec("Index Payment_reference_key", `CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference")`);
    await exec("Index Payment_orderId_idx", `CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId")`);
    await exec("Index Payment_status_createdAt_idx", `CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status","createdAt")`);
    await exec("FK Payment_orderId_fkey", `ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
  } else { console.log("  ⏭  Payment table already exists"); }

  if (!tables.has("PaymentEvent")) {
    await exec("CREATE PaymentEvent", `
      CREATE TABLE "PaymentEvent" (
        "id" TEXT NOT NULL,
        "eventKey" TEXT NOT NULL,
        "provider" TEXT NOT NULL DEFAULT 'PAYSTACK',
        "type" TEXT NOT NULL,
        "reference" TEXT,
        "paymentId" TEXT,
        "payload" JSONB NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'RECEIVED',
        "error" TEXT,
        "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "processedAt" TIMESTAMP(3),
        CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
      )`);
    await exec("Index PaymentEvent_eventKey_key", `CREATE UNIQUE INDEX "PaymentEvent_eventKey_key" ON "PaymentEvent"("eventKey")`);
    await exec("Index PaymentEvent_reference_idx", `CREATE INDEX "PaymentEvent_reference_idx" ON "PaymentEvent"("reference")`);
    await exec("Index PaymentEvent_status_receivedAt_idx", `CREATE INDEX "PaymentEvent_status_receivedAt_idx" ON "PaymentEvent"("status","receivedAt")`);
    await exec("FK PaymentEvent_paymentId_fkey", `ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
  } else { console.log("  ⏭  PaymentEvent table already exists"); }

  if (!tables.has("ChatConversation")) {
    await exec("CREATE ChatConversation", `
      CREATE TABLE "ChatConversation" (
        "id" TEXT NOT NULL,
        "storeId" TEXT NOT NULL,
        "sessionId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
      )`);
    await exec("Index ChatConversation_storeId_updatedAt_idx", `CREATE INDEX "ChatConversation_storeId_updatedAt_idx" ON "ChatConversation"("storeId","updatedAt")`);
    await exec("Index ChatConversation_sessionId_idx", `CREATE INDEX "ChatConversation_sessionId_idx" ON "ChatConversation"("sessionId")`);
    await exec("FK ChatConversation_storeId_fkey", `ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  } else { console.log("  ⏭  ChatConversation table already exists"); }

  if (!tables.has("ChatMessage")) {
    await exec("CREATE ChatMessage", `
      CREATE TABLE "ChatMessage" (
        "id" TEXT NOT NULL,
        "conversationId" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
      )`);
    await exec("Index ChatMessage_conversationId_createdAt_idx", `CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId","createdAt")`);
    await exec("FK ChatMessage_conversationId_fkey", `ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  } else { console.log("  ⏭  ChatMessage table already exists"); }

  // Backfill
  console.log("  Backfilling Payment rows...");
  const bf = await client.query(`
    INSERT INTO "Payment" ("id","orderId","reference","amountKobo","currency","status","commissionBps","commissionKobo","merchantShareKobo","paidAt","createdAt","updatedAt")
    SELECT 'legacy_' || o."id", o."id", COALESCE(o."paystackReference", o."id"),
           GREATEST(ROUND(o."total" * 100)::INTEGER, 1), 'NGN', 'SUCCESS', 500,
           ROUND(ROUND(o."total" * 100) * 500 / 10000)::INTEGER,
           GREATEST(ROUND(o."total" * 100)::INTEGER, 1) - ROUND(ROUND(o."total" * 100) * 500 / 10000)::INTEGER,
           o."updatedAt", o."createdAt", o."updatedAt"
    FROM "Order" o
    WHERE o."status" IN ('PAID','SHIPPED','DELIVERED') AND o."total" > 0
    ON CONFLICT ("reference") DO NOTHING
  `);
  console.log(`  ✅ Backfilled ${bf.rowCount} Payment rows`);

  // ================================================================
  // MIGRATION 2
  // ================================================================
  console.log("\n--- MIGRATION 2: refunds_rate_limits ---");

  if (!tables.has("Refund")) {
    await exec("CREATE Refund", `
      CREATE TABLE "Refund" (
        "id" TEXT NOT NULL,
        "paymentId" TEXT NOT NULL,
        "amountKobo" INTEGER NOT NULL,
        "reason" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'REQUESTED',
        "requestedBy" TEXT NOT NULL,
        "decidedBy" TEXT,
        "decidedAt" TIMESTAMP(3),
        "providerRefundId" TEXT,
        "providerStatus" TEXT,
        "failureReason" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Refund_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Refund_amount_positive" CHECK ("amountKobo" > 0)
      )`);
    await exec("Index Refund_status_createdAt_idx", `CREATE INDEX "Refund_status_createdAt_idx" ON "Refund"("status","createdAt")`);
    await exec("Index Refund_paymentId_idx", `CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId")`);
    await exec("FK Refund_paymentId_fkey", `ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
  } else { console.log("  ⏭  Refund table already exists"); }

  if (!tables.has("RateLimitBucket")) {
    await exec("CREATE RateLimitBucket", `
      CREATE TABLE "RateLimitBucket" (
        "key" TEXT NOT NULL,
        "count" INTEGER NOT NULL,
        "resetAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
      )`);
    await exec("Index RateLimitBucket_resetAt_idx", `CREATE INDEX "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt")`);
  } else { console.log("  ⏭  RateLimitBucket table already exists"); }

  // ================================================================
  // Register _prisma_migrations
  // ================================================================
  console.log("\n--- Registering _prisma_migrations ---");
  await exec("CREATE _prisma_migrations", `
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) NOT NULL,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
    )`);

  for (const [id, name] of [
    ["mig-0001", "0_init"],
    ["mig-0002", "20261016000000_payments_chat_integrity"],
    ["mig-0003", "20261016010000_refunds_rate_limits"],
  ]) {
    await exec(`Register migration ${name}`,
      `INSERT INTO "_prisma_migrations" ("id","checksum","finished_at","migration_name","applied_steps_count") VALUES ($1,'manual',NOW(),$2,1) ON CONFLICT ("id") DO NOTHING`,
      [id, name]);
  }

  const { rows: final } = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`);
  console.log("\n✅ ALL DONE. Tables:", final.map((r) => r.tablename).join(", "));
  await client.end();
}

run().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
