/*
  Warnings:

  - Made the column `normalPriceSnapshot` on table `PromotionItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `promoPrice` on table `PromotionItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CourierDeliveryProof" ALTER COLUMN "recipientName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PromotionItem" ALTER COLUMN "normalPriceSnapshot" SET NOT NULL,
ALTER COLUMN "promoPrice" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;
