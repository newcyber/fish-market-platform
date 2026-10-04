-- PISJO MARKET
-- WAPI CUSTOMER NOTIFICATION ENGINE
-- Generated: 2026-10-02
--
-- Safe additive migration:
-- 1. Adds customer WhatsApp preference fields.
-- 2. Adds a separate customer-facing WhatsApp delivery ledger.
-- Existing admin WapiDelivery remains unchanged.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "wapiTransactionalEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "wapiMarketingOptIn" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "wapiMarketingOptInAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "wapiMarketingOptOutAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "WapiCustomerDelivery" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" TEXT,
  "eventKey" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "WapiDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "messageId" TEXT,
  "jid" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "processingStartedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WapiCustomerDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WapiCustomerDelivery_eventKey_key"
  ON "WapiCustomerDelivery"("eventKey");

CREATE INDEX IF NOT EXISTS "WapiCustomerDelivery_userId_createdAt_idx"
  ON "WapiCustomerDelivery"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "WapiCustomerDelivery_orderId_createdAt_idx"
  ON "WapiCustomerDelivery"("orderId", "createdAt");

CREATE INDEX IF NOT EXISTS "WapiCustomerDelivery_status_createdAt_idx"
  ON "WapiCustomerDelivery"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "WapiCustomerDelivery_eventType_createdAt_idx"
  ON "WapiCustomerDelivery"("eventType", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'WapiCustomerDelivery_userId_fkey'
  ) THEN
    ALTER TABLE "WapiCustomerDelivery"
      ADD CONSTRAINT "WapiCustomerDelivery_userId_fkey"
      FOREIGN KEY ("userId")
      REFERENCES "User"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'WapiCustomerDelivery_orderId_fkey'
  ) THEN
    ALTER TABLE "WapiCustomerDelivery"
      ADD CONSTRAINT "WapiCustomerDelivery_orderId_fkey"
      FOREIGN KEY ("orderId")
      REFERENCES "Order"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
