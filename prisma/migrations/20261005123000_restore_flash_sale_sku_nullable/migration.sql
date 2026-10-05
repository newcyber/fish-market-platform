-- Restore product-wide Flash Sale compatibility.
-- FlashSaleItem.skuId is intentionally nullable:
--   NULL = Flash Sale applies to the product as a whole.
--   value = Flash Sale targets a canonical SKU.
--
-- Keep the unique index from the previous migration. PostgreSQL allows
-- multiple NULL values in a unique index, while non-null SKU values remain
-- unique within a Flash Sale campaign.
ALTER TABLE "FlashSaleItem"
  ALTER COLUMN "skuId" DROP NOT NULL;
