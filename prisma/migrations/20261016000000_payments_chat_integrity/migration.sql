-- Additive migration: payments ledger, webhook idempotency, chat persistence,
-- integrity constraints and indexes. No columns or tables are dropped.
--
-- PRE-FLIGHT (run on production BEFORE deploying; the unique index below fails
-- if duplicates exist):
--   SELECT "orderId","productId",COUNT(*) FROM "Review" GROUP BY 1,2 HAVING COUNT(*)>1;
-- Resolve any rows returned (keep the newest) before applying.

-- Order: currency + idempotency key
ALTER TABLE "Order" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'NGN';
ALTER TABLE "Order" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
CREATE INDEX "Order_storeId_createdAt_idx" ON "Order"("storeId", "createdAt");
CREATE INDEX "Order_storeId_status_idx" ON "Order"("storeId", "status");
CREATE INDEX "Order_customerEmail_idx" ON "Order"("customerEmail");

-- Read-path indexes
CREATE INDEX "Product_storeId_inStock_idx" ON "Product"("storeId", "inStock");
CREATE INDEX "ProductMedia_productId_order_idx" ON "ProductMedia"("productId", "order");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
CREATE INDEX "Variant_productId_idx" ON "Variant"("productId");
CREATE INDEX "Review_productId_createdAt_idx" ON "Review"("productId", "createdAt");
CREATE UNIQUE INDEX "Review_orderId_productId_key" ON "Review"("orderId", "productId");

-- Payments (integer kobo)
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Payment_amount_positive" CHECK ("amountKobo" > 0),
    CONSTRAINT "Payment_split_consistent" CHECK ("commissionKobo" + "merchantShareKobo" = "amountKobo")
);
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
);
CREATE UNIQUE INDEX "PaymentEvent_eventKey_key" ON "PaymentEvent"("eventKey");
CREATE INDEX "PaymentEvent_reference_idx" ON "PaymentEvent"("reference");
CREATE INDEX "PaymentEvent_status_receivedAt_idx" ON "PaymentEvent"("status", "receivedAt");
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Chat persistence
CREATE TABLE "ChatConversation" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ChatConversation_storeId_updatedAt_idx" ON "ChatConversation"("storeId", "updatedAt");
CREATE INDEX "ChatConversation_sessionId_idx" ON "ChatConversation"("sessionId");
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt");
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: give pre-existing paid orders a Payment row so the ledger is complete.
-- Commission is snapshotted at 5% (the rate hard-coded before this migration).
INSERT INTO "Payment" ("id","orderId","reference","amountKobo","currency","status","commissionBps","commissionKobo","merchantShareKobo","paidAt","createdAt","updatedAt")
SELECT 'legacy_' || o."id", o."id", COALESCE(o."paystackReference", o."id"),
       ROUND(o."total" * 100)::INTEGER, 'NGN', 'SUCCESS', 500,
       ROUND(ROUND(o."total" * 100) * 500 / 10000)::INTEGER,
       ROUND(o."total" * 100)::INTEGER - ROUND(ROUND(o."total" * 100) * 500 / 10000)::INTEGER,
       o."updatedAt", o."createdAt", o."updatedAt"
FROM "Order" o
WHERE o."status" IN ('PAID','SHIPPED','DELIVERED') AND o."total" > 0
ON CONFLICT ("reference") DO NOTHING;
