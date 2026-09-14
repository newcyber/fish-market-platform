-- CreateTable
CREATE TABLE "LandingPageSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingPageSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingPageSeoAnalysis" (
    "id" TEXT NOT NULL,
    "landingPageSettingsId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "analysis" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'RULE_ENGINE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandingPageSeoAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingPageAndroidApp" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "appName" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "sha256" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingPageAndroidApp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LandingPageSettings_key_key" ON "LandingPageSettings"("key");

-- CreateIndex
CREATE INDEX "LandingPageSeoAnalysis_landingPageSettingsId_createdAt_idx" ON "LandingPageSeoAnalysis"("landingPageSettingsId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LandingPageAndroidApp_key_key" ON "LandingPageAndroidApp"("key");

-- AddForeignKey
ALTER TABLE "LandingPageSeoAnalysis" ADD CONSTRAINT "LandingPageSeoAnalysis_landingPageSettingsId_fkey" FOREIGN KEY ("landingPageSettingsId") REFERENCES "LandingPageSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
