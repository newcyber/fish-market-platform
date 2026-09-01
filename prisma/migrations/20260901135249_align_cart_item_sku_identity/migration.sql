/*
  Warnings:

  - A unique constraint covering the columns `[cartId,productId,skuId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CartItem_cartId_productId_productVariant_productWeight_key";

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_skuId_key" ON "CartItem"("cartId", "productId", "skuId");
