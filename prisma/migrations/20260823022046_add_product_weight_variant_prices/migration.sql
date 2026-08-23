-- CreateTable
CREATE TABLE "ProductWeightVariantPrice" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "weightOptionId" TEXT NOT NULL,
    "variantOptionId" TEXT NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductWeightVariantPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductWeightVariantPrice_productId_idx" ON "ProductWeightVariantPrice"("productId");

-- CreateIndex
CREATE INDEX "ProductWeightVariantPrice_weightOptionId_idx" ON "ProductWeightVariantPrice"("weightOptionId");

-- CreateIndex
CREATE INDEX "ProductWeightVariantPrice_variantOptionId_idx" ON "ProductWeightVariantPrice"("variantOptionId");

-- CreateIndex
CREATE INDEX "ProductWeightVariantPrice_productId_weightOptionId_idx" ON "ProductWeightVariantPrice"("productId", "weightOptionId");

-- CreateIndex
CREATE INDEX "ProductWeightVariantPrice_productId_variantOptionId_idx" ON "ProductWeightVariantPrice"("productId", "variantOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductWeightVariantPrice_productId_weightOptionId_variantO_key" ON "ProductWeightVariantPrice"("productId", "weightOptionId", "variantOptionId");

-- AddForeignKey
ALTER TABLE "ProductWeightVariantPrice" ADD CONSTRAINT "ProductWeightVariantPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductWeightVariantPrice" ADD CONSTRAINT "ProductWeightVariantPrice_weightOptionId_fkey" FOREIGN KEY ("weightOptionId") REFERENCES "ProductWeightOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductWeightVariantPrice" ADD CONSTRAINT "ProductWeightVariantPrice_variantOptionId_fkey" FOREIGN KEY ("variantOptionId") REFERENCES "ProductVariantOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
