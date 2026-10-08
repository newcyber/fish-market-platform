-- PISJO Phase 1: physical inventory pool per Product + Ukuran.
-- Safe to apply only after the corresponding Prisma schema is installed.

CREATE TABLE "ProductInventoryPool" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sizeVariantOptionId" TEXT NOT NULL,
  "stockGrams" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductInventoryPool_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductInventoryPoolLedger" (
  "id" TEXT NOT NULL,
  "poolId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sizeVariantOptionId" TEXT NOT NULL,
  "quantityGrams" INTEGER NOT NULL,
  "stockBeforeGrams" INTEGER NOT NULL,
  "stockAfterGrams" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "actorUserId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductInventoryPoolLedger_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductInventoryPool_productId_sizeVariantOptionId_key"
  ON "ProductInventoryPool"("productId", "sizeVariantOptionId");
CREATE INDEX "ProductInventoryPool_productId_idx"
  ON "ProductInventoryPool"("productId");
CREATE INDEX "ProductInventoryPool_sizeVariantOptionId_idx"
  ON "ProductInventoryPool"("sizeVariantOptionId");
CREATE INDEX "ProductInventoryPool_stockGrams_idx"
  ON "ProductInventoryPool"("stockGrams");

CREATE INDEX "ProductInventoryPoolLedger_poolId_idx"
  ON "ProductInventoryPoolLedger"("poolId");
CREATE INDEX "ProductInventoryPoolLedger_productId_idx"
  ON "ProductInventoryPoolLedger"("productId");
CREATE INDEX "ProductInventoryPoolLedger_sizeVariantOptionId_idx"
  ON "ProductInventoryPoolLedger"("sizeVariantOptionId");
CREATE INDEX "ProductInventoryPoolLedger_type_idx"
  ON "ProductInventoryPoolLedger"("type");
CREATE INDEX "ProductInventoryPoolLedger_createdAt_idx"
  ON "ProductInventoryPoolLedger"("createdAt");

ALTER TABLE "ProductInventoryPool"
  ADD CONSTRAINT "ProductInventoryPool_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductInventoryPool"
  ADD CONSTRAINT "ProductInventoryPool_sizeVariantOptionId_fkey"
  FOREIGN KEY ("sizeVariantOptionId") REFERENCES "ProductVariantOptionNew"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductInventoryPoolLedger"
  ADD CONSTRAINT "ProductInventoryPoolLedger_poolId_fkey"
  FOREIGN KEY ("poolId") REFERENCES "ProductInventoryPool"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
