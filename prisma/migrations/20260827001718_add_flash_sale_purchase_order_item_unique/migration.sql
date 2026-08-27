/*
  Warnings:

  - A unique constraint covering the columns `[orderId,flashSaleItemId]` on the table `FlashSalePurchase` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FlashSalePurchase_orderId_flashSaleItemId_key" ON "FlashSalePurchase"("orderId", "flashSaleItemId");
