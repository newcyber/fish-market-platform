-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "weightSku" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "weightSku" TEXT;

-- AlterTable
ALTER TABLE "ProductWeightOption" ADD COLUMN     "sku" TEXT;

-- CreateIndex
CREATE INDEX "ProductWeightOption_sku_idx" ON "ProductWeightOption"("sku");
