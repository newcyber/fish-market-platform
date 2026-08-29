-- CreateTable
CREATE TABLE "RewardVoucherSetting" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requiredPoints" INTEGER NOT NULL,
    "discountType" "VoucherDiscountType" NOT NULL,
    "discountValue" DECIMAL(12,2) NOT NULL,
    "minimumPurchase" DECIMAL(12,2),
    "maximumDiscount" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardVoucherSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVoucher" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardVoucherSettingId" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "pointsSpent" INTEGER NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RewardVoucherSetting_requiredPoints_idx" ON "RewardVoucherSetting"("requiredPoints");

-- CreateIndex
CREATE INDEX "RewardVoucherSetting_isActive_idx" ON "RewardVoucherSetting"("isActive");

-- CreateIndex
CREATE INDEX "RewardVoucherSetting_sortOrder_idx" ON "RewardVoucherSetting"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "UserVoucher_voucherId_key" ON "UserVoucher"("voucherId");

-- CreateIndex
CREATE INDEX "UserVoucher_userId_idx" ON "UserVoucher"("userId");

-- CreateIndex
CREATE INDEX "UserVoucher_rewardVoucherSettingId_idx" ON "UserVoucher"("rewardVoucherSettingId");

-- CreateIndex
CREATE INDEX "UserVoucher_userId_redeemedAt_idx" ON "UserVoucher"("userId", "redeemedAt");

-- AddForeignKey
ALTER TABLE "UserVoucher" ADD CONSTRAINT "UserVoucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVoucher" ADD CONSTRAINT "UserVoucher_rewardVoucherSettingId_fkey" FOREIGN KEY ("rewardVoucherSettingId") REFERENCES "RewardVoucherSetting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVoucher" ADD CONSTRAINT "UserVoucher_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
