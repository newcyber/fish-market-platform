-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "stock" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "ProductWeightOption" ADD COLUMN     "price" DECIMAL(12,2);
