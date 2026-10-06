ALTER TABLE "OrderItem"
  ADD COLUMN "promotionId" TEXT,
  ADD COLUMN "promotionName" TEXT,
  ADD COLUMN "promotionType" TEXT,
  ADD COLUMN "flashSaleId" TEXT,
  ADD COLUMN "normalPriceSnapshot" DECIMAL(12,2),
  ADD COLUMN "promoPriceSnapshot" DECIMAL(12,2),
  ADD COLUMN "discountAmountSnapshot" DECIMAL(12,2);

CREATE INDEX "OrderItem_promotionId_idx" ON "OrderItem"("promotionId");
CREATE INDEX "OrderItem_flashSaleId_idx" ON "OrderItem"("flashSaleId");
