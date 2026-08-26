-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "skuId" TEXT;

-- AlterTable
ALTER TABLE "FlashSaleItem" ADD COLUMN     "skuId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "skuId" TEXT;

-- AlterTable
ALTER TABLE "StockLedger" ADD COLUMN     "skuId" TEXT;

-- CreateTable
CREATE TABLE "ProductVariantGroup" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariantGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariantOptionNew" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariantOptionNew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSku" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "isDiscountActive" BOOLEAN NOT NULL DEFAULT false,
    "discountType" "ProductDiscountType",
    "discountValue" DECIMAL(12,2),
    "discountStartAt" TIMESTAMP(3),
    "discountEndAt" TIMESTAMP(3),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSkuOption" (
    "id" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "variantOptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSkuOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductVariantGroup_productId_idx" ON "ProductVariantGroup"("productId");

-- CreateIndex
CREATE INDEX "ProductVariantGroup_productId_sortOrder_idx" ON "ProductVariantGroup"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductVariantGroup_isActive_idx" ON "ProductVariantGroup"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantGroup_productId_name_key" ON "ProductVariantGroup"("productId", "name");

-- CreateIndex
CREATE INDEX "ProductVariantOptionNew_groupId_idx" ON "ProductVariantOptionNew"("groupId");

-- CreateIndex
CREATE INDEX "ProductVariantOptionNew_groupId_sortOrder_idx" ON "ProductVariantOptionNew"("groupId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductVariantOptionNew_isActive_idx" ON "ProductVariantOptionNew"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantOptionNew_groupId_label_key" ON "ProductVariantOptionNew"("groupId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSku_sku_key" ON "ProductSku"("sku");

-- CreateIndex
CREATE INDEX "ProductSku_productId_idx" ON "ProductSku"("productId");

-- CreateIndex
CREATE INDEX "ProductSku_productId_isActive_idx" ON "ProductSku"("productId", "isActive");

-- CreateIndex
CREATE INDEX "ProductSku_stock_idx" ON "ProductSku"("stock");

-- CreateIndex
CREATE INDEX "ProductSku_isDiscountActive_idx" ON "ProductSku"("isDiscountActive");

-- CreateIndex
CREATE INDEX "ProductSku_discountStartAt_idx" ON "ProductSku"("discountStartAt");

-- CreateIndex
CREATE INDEX "ProductSku_discountEndAt_idx" ON "ProductSku"("discountEndAt");

-- CreateIndex
CREATE INDEX "ProductSkuOption_skuId_idx" ON "ProductSkuOption"("skuId");

-- CreateIndex
CREATE INDEX "ProductSkuOption_variantOptionId_idx" ON "ProductSkuOption"("variantOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSkuOption_skuId_variantOptionId_key" ON "ProductSkuOption"("skuId", "variantOptionId");

-- CreateIndex
CREATE INDEX "CartItem_skuId_idx" ON "CartItem"("skuId");

-- CreateIndex
CREATE INDEX "FlashSaleItem_skuId_idx" ON "FlashSaleItem"("skuId");

-- CreateIndex
CREATE INDEX "OrderItem_skuId_idx" ON "OrderItem"("skuId");

-- CreateIndex
CREATE INDEX "StockLedger_skuId_idx" ON "StockLedger"("skuId");

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "ProductSku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashSaleItem" ADD CONSTRAINT "FlashSaleItem_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "ProductSku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantGroup" ADD CONSTRAINT "ProductVariantGroup_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantOptionNew" ADD CONSTRAINT "ProductVariantOptionNew_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ProductVariantGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSku" ADD CONSTRAINT "ProductSku_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSkuOption" ADD CONSTRAINT "ProductSkuOption_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "ProductSku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSkuOption" ADD CONSTRAINT "ProductSkuOption_variantOptionId_fkey" FOREIGN KEY ("variantOptionId") REFERENCES "ProductVariantOptionNew"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLedger" ADD CONSTRAINT "StockLedger_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "ProductSku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "ProductSku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
