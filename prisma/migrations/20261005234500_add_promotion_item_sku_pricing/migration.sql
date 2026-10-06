-- Pisjo Market Promo P0.1 repaired migration
-- Adds SKU-specific pricing fields to the existing PromotionItem table.
-- No data reset. Existing rows remain valid because all new columns are nullable.

ALTER TABLE "PromotionItem"
  ADD COLUMN IF NOT EXISTS "normalPriceSnapshot" DECIMAL(12,2);

ALTER TABLE "PromotionItem"
  ADD COLUMN IF NOT EXISTS "promoPrice" DECIMAL(12,2);

ALTER TABLE "PromotionItem"
  ADD COLUMN IF NOT EXISTS "discountType" "PromotionDiscountType";

ALTER TABLE "PromotionItem"
  ADD COLUMN IF NOT EXISTS "discountValue" DECIMAL(12,2);
