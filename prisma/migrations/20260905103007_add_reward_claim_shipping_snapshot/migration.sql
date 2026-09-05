/*
  Warnings:

  - Added the required column `city` to the `RewardClaim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district` to the `RewardClaim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullAddress` to the `RewardClaim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postalCode` to the `RewardClaim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province` to the `RewardClaim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverName` to the `RewardClaim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverPhone` to the `RewardClaim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `village` to the `RewardClaim` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RewardClaim" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "district" TEXT NOT NULL,
ADD COLUMN     "fullAddress" TEXT NOT NULL,
ADD COLUMN     "latitude" DECIMAL(10,7),
ADD COLUMN     "longitude" DECIMAL(10,7),
ADD COLUMN     "postalCode" TEXT NOT NULL,
ADD COLUMN     "province" TEXT NOT NULL,
ADD COLUMN     "receiverName" TEXT NOT NULL,
ADD COLUMN     "receiverPhone" TEXT NOT NULL,
ADD COLUMN     "village" TEXT NOT NULL;
