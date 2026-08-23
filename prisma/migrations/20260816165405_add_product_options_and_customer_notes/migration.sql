/*
  Warnings:

  - A unique constraint covering the columns `[cartId,productId,productVariant,productWeight]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CartItem_cartId_productId_key";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "customerNote" TEXT,
ADD COLUMN     "productVariant" TEXT,
ADD COLUMN     "productWeight" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "customerNote" TEXT,
ADD COLUMN     "productVariant" TEXT,
ADD COLUMN     "productWeight" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_productVariant_productWeight_key" ON "CartItem"("cartId", "productId", "productVariant", "productWeight");
