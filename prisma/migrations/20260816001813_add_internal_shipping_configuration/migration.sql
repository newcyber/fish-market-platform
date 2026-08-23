-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "internalShippingBaseFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "internalShippingEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "internalShippingFreeThreshold" DECIMAL(14,2),
ADD COLUMN     "internalShippingMaxDistance" DECIMAL(10,2) NOT NULL DEFAULT 10,
ADD COLUMN     "internalShippingName" TEXT NOT NULL DEFAULT 'Kurir Internal',
ADD COLUMN     "internalShippingPerKmFee" DECIMAL(12,2) NOT NULL DEFAULT 0;
