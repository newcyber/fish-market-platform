/*
  Warnings:

  - Made the column `price` on table `ProductWeightOption` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ProductWeightOption" ALTER COLUMN "price" SET NOT NULL;
