-- Pisjo Market Voucher Engine
-- Adds:
-- 1. Voucher campaign type: DISCOUNT / FREE_SHIPPING
-- 2. Claimable voucher wallet
-- 3. Global claim quota
-- 4. Maximum free-shipping subsidy
-- 5. Multiple UserVoucher records per campaign voucher
-- 6. Shipping discount snapshots

CREATE TYPE "VoucherType" AS ENUM ('DISCOUNT', 'FREE_SHIPPING');

ALTER TABLE "Voucher"
  ADD COLUMN "type" "VoucherType" NOT NULL DEFAULT 'DISCOUNT',
  ADD COLUMN "claimable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "claimLimit" INTEGER,
  ADD COLUMN "claimCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "maximumShippingDiscount" DECIMAL(12,2);

ALTER TABLE "Order"
  ADD COLUMN "voucherShippingDiscount" DECIMAL(12,2) NOT NULL DEFAULT 0;

ALTER TABLE "VoucherUsage"
  ADD COLUMN "shippingDiscountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

ALTER TABLE "UserVoucher"
  ALTER COLUMN "rewardVoucherSettingId" DROP NOT NULL;

DROP INDEX IF EXISTS "UserVoucher_voucherId_key";

ALTER TABLE "UserVoucher"
  ADD COLUMN "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "UserVoucher_userId_voucherId_key"
  ON "UserVoucher"("userId", "voucherId");

CREATE INDEX "UserVoucher_voucherId_idx"
  ON "UserVoucher"("voucherId");

CREATE INDEX "UserVoucher_claimedAt_idx"
  ON "UserVoucher"("userId", "claimedAt");
