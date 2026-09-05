-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "internalShippingFreeMaxDiscount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "internalShippingMinFee" DECIMAL(12,2) NOT NULL DEFAULT 0;
