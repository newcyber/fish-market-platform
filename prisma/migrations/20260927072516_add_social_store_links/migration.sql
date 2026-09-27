-- CreateTable
CREATE TABLE "social_store_links" (
    "id" TEXT NOT NULL,
    "googlePlayUrl" TEXT,
    "shopeeUrl" TEXT,
    "tokopediaUrl" TEXT,
    "tiktokUrl" TEXT,
    "instagramUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_store_links_pkey" PRIMARY KEY ("id")
);
