-- AlterEnum
ALTER TYPE "RewardPointTransactionType" ADD VALUE 'REFUND';

-- AlterTable
ALTER TABLE "RewardClaim" ADD COLUMN     "refundedAt" TIMESTAMP(3);
