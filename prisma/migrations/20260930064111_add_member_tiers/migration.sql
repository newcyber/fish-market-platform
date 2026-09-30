-- AlterTable
ALTER TABLE "User" ADD COLUMN     "memberTierId" TEXT;

-- AlterTable
ALTER TABLE "UserVoucher" ALTER COLUMN "pointsSpent" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "MemberTier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "minSpend" DECIMAL(12,2) NOT NULL,
    "bonusPointsPercent" INTEGER NOT NULL DEFAULT 0,
    "freeShipping" BOOLEAN NOT NULL DEFAULT false,
    "prioritySupport" BOOLEAN NOT NULL DEFAULT false,
    "exclusivePricing" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberTier_slug_key" ON "MemberTier"("slug");

-- CreateIndex
CREATE INDEX "MemberTier_minSpend_idx" ON "MemberTier"("minSpend");

-- CreateIndex
CREATE INDEX "MemberTier_isActive_idx" ON "MemberTier"("isActive");

-- CreateIndex
CREATE INDEX "MemberTier_sortOrder_idx" ON "MemberTier"("sortOrder");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_memberTierId_fkey" FOREIGN KEY ("memberTierId") REFERENCES "MemberTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "UserVoucher_claimedAt_idx" RENAME TO "UserVoucher_userId_claimedAt_idx";
