-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('MARKETING', 'PRICE_DISCOUNT');

-- CreateEnum
CREATE TYPE "PromotionDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "banner" TEXT,
    "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "type" "PromotionType" NOT NULL DEFAULT 'MARKETING',
    "discountType" "PromotionDiscountType",
    "discountValue" DECIMAL(12,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionItem" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_slug_key" ON "Promotion"("slug");

-- CreateIndex
CREATE INDEX "Promotion_status_idx" ON "Promotion"("status");

-- CreateIndex
CREATE INDEX "Promotion_startAt_idx" ON "Promotion"("startAt");

-- CreateIndex
CREATE INDEX "Promotion_endAt_idx" ON "Promotion"("endAt");

-- CreateIndex
CREATE INDEX "Promotion_sortOrder_idx" ON "Promotion"("sortOrder");

-- CreateIndex
CREATE INDEX "Promotion_isFeatured_idx" ON "Promotion"("isFeatured");

-- CreateIndex
CREATE INDEX "Promotion_deletedAt_idx" ON "Promotion"("deletedAt");

-- CreateIndex
CREATE INDEX "Promotion_status_startAt_endAt_idx" ON "Promotion"("status", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "PromotionItem_promotionId_idx" ON "PromotionItem"("promotionId");

-- CreateIndex
CREATE INDEX "PromotionItem_skuId_idx" ON "PromotionItem"("skuId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionItem_promotionId_skuId_key" ON "PromotionItem"("promotionId", "skuId");

-- AddForeignKey
ALTER TABLE "PromotionItem" ADD CONSTRAINT "PromotionItem_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionItem" ADD CONSTRAINT "PromotionItem_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "ProductSku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
