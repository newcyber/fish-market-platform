-- CreateEnum
CREATE TYPE "ProductDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "discountEndAt" TIMESTAMP(3),
ADD COLUMN     "discountStartAt" TIMESTAMP(3),
ADD COLUMN     "discountType" "ProductDiscountType",
ADD COLUMN     "discountValue" DECIMAL(12,2),
ADD COLUMN     "isDiscountActive" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_isDiscountActive_idx" ON "Product"("isDiscountActive");

-- CreateIndex
CREATE INDEX "Product_discountStartAt_idx" ON "Product"("discountStartAt");

-- CreateIndex
CREATE INDEX "Product_discountEndAt_idx" ON "Product"("discountEndAt");
