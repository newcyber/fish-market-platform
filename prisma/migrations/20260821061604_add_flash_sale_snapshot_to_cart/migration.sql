-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "flashSaleId" TEXT,
ADD COLUMN     "flashSaleItemId" TEXT,
ADD COLUMN     "isFlashSaleApplied" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "CartItem_flashSaleId_idx" ON "CartItem"("flashSaleId");

-- CreateIndex
CREATE INDEX "CartItem_flashSaleItemId_idx" ON "CartItem"("flashSaleItemId");

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_flashSaleId_fkey" FOREIGN KEY ("flashSaleId") REFERENCES "FlashSale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_flashSaleItemId_fkey" FOREIGN KEY ("flashSaleItemId") REFERENCES "FlashSaleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
