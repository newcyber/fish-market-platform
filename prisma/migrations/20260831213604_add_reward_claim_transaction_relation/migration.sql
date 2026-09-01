-- AlterTable
ALTER TABLE "RewardPointTransaction" ADD COLUMN     "rewardClaimId" TEXT;

-- CreateIndex
CREATE INDEX "RewardPointTransaction_rewardClaimId_idx" ON "RewardPointTransaction"("rewardClaimId");

-- AddForeignKey
ALTER TABLE "RewardPointTransaction" ADD CONSTRAINT "RewardPointTransaction_rewardClaimId_fkey" FOREIGN KEY ("rewardClaimId") REFERENCES "RewardClaim"("id") ON DELETE SET NULL ON UPDATE CASCADE;
