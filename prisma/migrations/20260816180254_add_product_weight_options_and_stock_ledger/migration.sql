/*
  Warnings:

  - You are about to drop the column `image` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `Product` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "StockLedger" DROP CONSTRAINT "StockLedger_productId_fkey";

-- DropIndex
DROP INDEX "Product_featured_idx";

-- DropIndex
DROP INDEX "Product_isPublished_idx";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "image",
DROP COLUMN "isActive",
DROP COLUMN "sortOrder";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "unit",
DROP COLUMN "weight";

-- CreateTable
CREATE TABLE "ProductWeightOption" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductWeightOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductWeightOption_productId_idx" ON "ProductWeightOption"("productId");

-- CreateIndex
CREATE INDEX "ProductWeightOption_isActive_idx" ON "ProductWeightOption"("isActive");

-- CreateIndex
CREATE INDEX "ProductWeightOption_sortOrder_idx" ON "ProductWeightOption"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProductWeightOption_productId_label_key" ON "ProductWeightOption"("productId", "label");

-- AddForeignKey
ALTER TABLE "ProductWeightOption" ADD CONSTRAINT "ProductWeightOption_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLedger" ADD CONSTRAINT "StockLedger_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
