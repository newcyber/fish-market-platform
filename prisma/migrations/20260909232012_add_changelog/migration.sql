-- CreateEnum
CREATE TYPE "ChangelogType" AS ENUM ('FEATURE', 'IMPROVEMENT', 'FIX', 'PERFORMANCE');

-- CreateTable
CREATE TABLE "ChangelogRelease" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChangelogRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangelogEntry" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "type" "ChangelogType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "highlights" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChangelogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChangelogRelease_isPublished_date_idx" ON "ChangelogRelease"("isPublished", "date");

-- CreateIndex
CREATE INDEX "ChangelogRelease_sortOrder_idx" ON "ChangelogRelease"("sortOrder");

-- CreateIndex
CREATE INDEX "ChangelogEntry_releaseId_sortOrder_idx" ON "ChangelogEntry"("releaseId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ChangelogEntry" ADD CONSTRAINT "ChangelogEntry_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "ChangelogRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
