-- AlterTable
ALTER TABLE "RewardCatalog" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "RewardCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RewardCategory_slug_key" ON "RewardCategory"("slug");

-- CreateIndex
CREATE INDEX "RewardCategory_isActive_idx" ON "RewardCategory"("isActive");

-- CreateIndex
CREATE INDEX "RewardCategory_sortOrder_idx" ON "RewardCategory"("sortOrder");

-- CreateIndex
CREATE INDEX "RewardCatalog_categoryId_idx" ON "RewardCatalog"("categoryId");

-- AddForeignKey
ALTER TABLE "RewardCatalog" ADD CONSTRAINT "RewardCatalog_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RewardCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
