-- CreateTable
CREATE TABLE "ProductVariantOption" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariantOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductVariantOption_productId_idx" ON "ProductVariantOption"("productId");

-- CreateIndex
CREATE INDEX "ProductVariantOption_isActive_idx" ON "ProductVariantOption"("isActive");

-- CreateIndex
CREATE INDEX "ProductVariantOption_sortOrder_idx" ON "ProductVariantOption"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantOption_productId_label_key" ON "ProductVariantOption"("productId", "label");

-- AddForeignKey
ALTER TABLE "ProductVariantOption" ADD CONSTRAINT "ProductVariantOption_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
