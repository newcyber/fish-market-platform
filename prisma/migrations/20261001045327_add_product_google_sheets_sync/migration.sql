-- CreateTable
CREATE TABLE "ProductGoogleSheetsSyncConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "spreadsheetId" TEXT,
    "sheetName" TEXT NOT NULL DEFAULT 'Products',
    "range" TEXT NOT NULL DEFAULT 'A:C',
    "skuColumn" TEXT NOT NULL DEFAULT 'A',
    "priceColumn" TEXT NOT NULL DEFAULT 'B',
    "stockColumn" TEXT NOT NULL DEFAULT 'C',
    "headerRow" INTEGER NOT NULL DEFAULT 1,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncType" TEXT,
    "lastSyncStatus" TEXT,
    "lastSyncSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductGoogleSheetsSyncConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductGoogleSheetsSyncConfig_key_key" ON "ProductGoogleSheetsSyncConfig"("key");

-- CreateIndex
CREATE INDEX "ProductGoogleSheetsSyncConfig_enabled_idx" ON "ProductGoogleSheetsSyncConfig"("enabled");

-- CreateIndex
CREATE INDEX "ProductGoogleSheetsSyncConfig_lastSyncAt_idx" ON "ProductGoogleSheetsSyncConfig"("lastSyncAt");
