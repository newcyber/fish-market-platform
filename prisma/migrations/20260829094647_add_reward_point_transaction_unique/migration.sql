/*
  Warnings:

  - A unique constraint covering the columns `[orderId,type]` on the table `RewardPointTransaction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "RewardPointTransaction_orderId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "RewardPointTransaction_orderId_type_key" ON "RewardPointTransaction"("orderId", "type");
