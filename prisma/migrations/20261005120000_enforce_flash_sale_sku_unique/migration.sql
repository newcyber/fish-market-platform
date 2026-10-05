-- FlashSaleItem SKU is now the canonical sellable unit.
-- The application audit confirmed zero NULL skuId rows before this migration.
-- Fail intentionally if any legacy NULL row exists instead of guessing a SKU.
ALTER TABLE "FlashSaleItem"
  ALTER COLUMN "skuId" SET NOT NULL;

-- Prevent concurrent creation of the same SKU in one Flash Sale.
CREATE UNIQUE INDEX "FlashSaleItem_flashSaleId_skuId_key"
  ON "FlashSaleItem"("flashSaleId", "skuId");
