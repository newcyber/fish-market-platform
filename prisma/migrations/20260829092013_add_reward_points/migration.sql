-- CreateEnum
CREATE TYPE "RewardPointTransactionType" AS ENUM ('EARN', 'REDEEM', 'ADJUSTMENT', 'EXPIRED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "rewardPointsBalance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "RewardPointTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" "RewardPointTransactionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "weightGrams" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardPointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RewardPointTransaction_userId_idx" ON "RewardPointTransaction"("userId");

-- CreateIndex
CREATE INDEX "RewardPointTransaction_orderId_idx" ON "RewardPointTransaction"("orderId");

-- CreateIndex
CREATE INDEX "RewardPointTransaction_userId_createdAt_idx" ON "RewardPointTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RewardPointTransaction_type_idx" ON "RewardPointTransaction"("type");

-- AddForeignKey
ALTER TABLE "RewardPointTransaction" ADD CONSTRAINT "RewardPointTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardPointTransaction" ADD CONSTRAINT "RewardPointTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
