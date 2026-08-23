-- CreateEnum
CREATE TYPE "FlashSaleStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "FlashSale" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "banner" TEXT,
    "status" "FlashSaleStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FlashSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashSaleItem" (
    "id" TEXT NOT NULL,
    "flashSaleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "weightOptionId" TEXT,
    "originalPrice" DECIMAL(12,2) NOT NULL,
    "flashPrice" DECIMAL(12,2) NOT NULL,
    "stockLimit" INTEGER NOT NULL,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "perUserLimit" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlashSaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashSalePurchase" (
    "id" TEXT NOT NULL,
    "flashSaleItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlashSalePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlashSale_slug_key" ON "FlashSale"("slug");

-- CreateIndex
CREATE INDEX "FlashSale_slug_idx" ON "FlashSale"("slug");

-- CreateIndex
CREATE INDEX "FlashSale_status_idx" ON "FlashSale"("status");

-- CreateIndex
CREATE INDEX "FlashSale_startAt_idx" ON "FlashSale"("startAt");

-- CreateIndex
CREATE INDEX "FlashSale_endAt_idx" ON "FlashSale"("endAt");

-- CreateIndex
CREATE INDEX "FlashSale_sortOrder_idx" ON "FlashSale"("sortOrder");

-- CreateIndex
CREATE INDEX "FlashSale_deletedAt_idx" ON "FlashSale"("deletedAt");

-- CreateIndex
CREATE INDEX "FlashSale_status_startAt_endAt_idx" ON "FlashSale"("status", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "FlashSaleItem_flashSaleId_idx" ON "FlashSaleItem"("flashSaleId");

-- CreateIndex
CREATE INDEX "FlashSaleItem_productId_idx" ON "FlashSaleItem"("productId");

-- CreateIndex
CREATE INDEX "FlashSaleItem_weightOptionId_idx" ON "FlashSaleItem"("weightOptionId");

-- CreateIndex
CREATE INDEX "FlashSaleItem_isActive_idx" ON "FlashSaleItem"("isActive");

-- CreateIndex
CREATE INDEX "FlashSaleItem_sortOrder_idx" ON "FlashSaleItem"("sortOrder");

-- CreateIndex
CREATE INDEX "FlashSaleItem_flashSaleId_isActive_idx" ON "FlashSaleItem"("flashSaleId", "isActive");

-- CreateIndex
CREATE INDEX "FlashSalePurchase_flashSaleItemId_idx" ON "FlashSalePurchase"("flashSaleItemId");

-- CreateIndex
CREATE INDEX "FlashSalePurchase_userId_idx" ON "FlashSalePurchase"("userId");

-- CreateIndex
CREATE INDEX "FlashSalePurchase_orderId_idx" ON "FlashSalePurchase"("orderId");

-- CreateIndex
CREATE INDEX "FlashSalePurchase_flashSaleItemId_userId_idx" ON "FlashSalePurchase"("flashSaleItemId", "userId");

-- AddForeignKey
ALTER TABLE "FlashSaleItem" ADD CONSTRAINT "FlashSaleItem_flashSaleId_fkey" FOREIGN KEY ("flashSaleId") REFERENCES "FlashSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashSaleItem" ADD CONSTRAINT "FlashSaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashSaleItem" ADD CONSTRAINT "FlashSaleItem_weightOptionId_fkey" FOREIGN KEY ("weightOptionId") REFERENCES "ProductWeightOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashSalePurchase" ADD CONSTRAINT "FlashSalePurchase_flashSaleItemId_fkey" FOREIGN KEY ("flashSaleItemId") REFERENCES "FlashSaleItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashSalePurchase" ADD CONSTRAINT "FlashSalePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashSalePurchase" ADD CONSTRAINT "FlashSalePurchase_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
