/*
  Warnings:

  - A unique constraint covering the columns `[guestCartId]` on the table `Cart` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "guestCartId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Cart_guestCartId_key" ON "Cart"("guestCartId");

-- CreateIndex
CREATE INDEX "Cart_guestCartId_idx" ON "Cart"("guestCartId");
