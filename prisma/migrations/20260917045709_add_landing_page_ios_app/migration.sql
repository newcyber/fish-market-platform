-- CreateTable
CREATE TABLE "LandingPageIosApp" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "appName" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "appStoreUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingPageIosApp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LandingPageIosApp_key_key" ON "LandingPageIosApp"("key");
