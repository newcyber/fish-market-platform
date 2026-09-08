-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "ingredients" TEXT,
ADD COLUMN     "nutritionInformation" JSONB,
ADD COLUMN     "storageInstructions" TEXT,
ADD COLUMN     "usageInstructions" TEXT;
