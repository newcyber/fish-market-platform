-- Snapshot shipping economics on each order so courier payout never depends
-- on current shipping configuration or customer-facing shipping discounts.

ALTER TABLE "Order"
  ADD COLUMN "shippingNormalCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "shippingDiscount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Backfill legacy orders with the only reliable historical shipping value
-- currently stored on Order. New checkout orders write the exact normal
-- shipping tariff and internal subsidy from the shipping quote.
UPDATE "Order"
SET
  "shippingNormalCost" = "shippingCost",
  "shippingDiscount" = 0
WHERE "shippingNormalCost" = 0;
