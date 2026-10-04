-- CreateEnum
CREATE TYPE "DatabaseBackupStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "DatabaseBackupType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'MANUAL');

-- CreateTable
CREATE TABLE "DatabaseBackup" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT,
    "sizeBytes" BIGINT,
    "checksum" TEXT,
    "status" "DatabaseBackupStatus" NOT NULL DEFAULT 'RUNNING',
    "backupType" "DatabaseBackupType" NOT NULL DEFAULT 'MANUAL',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatabaseBackup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatabaseBackup_filename_key" ON "DatabaseBackup"("filename");

-- CreateIndex
CREATE INDEX "DatabaseBackup_createdAt_idx" ON "DatabaseBackup"("createdAt");

-- CreateIndex
CREATE INDEX "DatabaseBackup_status_idx" ON "DatabaseBackup"("status");

-- CreateIndex
CREATE INDEX "DatabaseBackup_backupType_idx" ON "DatabaseBackup"("backupType");

-- CreateIndex
CREATE INDEX "DatabaseBackup_startedAt_idx" ON "DatabaseBackup"("startedAt");
