-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "isPreOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preOrderMaxDays" INTEGER,
ADD COLUMN     "preOrderMinDays" INTEGER;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "isPreOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preOrderMaxDays" INTEGER,
ADD COLUMN     "preOrderMinDays" INTEGER;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isPreOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preOrderMaxDays" INTEGER,
ADD COLUMN     "preOrderMinDays" INTEGER;
