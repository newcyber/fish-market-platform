-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "seoAiEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "seoCanonicalUrl" TEXT,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoGoogleVerification" TEXT,
ADD COLUMN     "seoKeywords" TEXT,
ADD COLUMN     "seoOgDescription" TEXT,
ADD COLUMN     "seoOgImage" TEXT,
ADD COLUMN     "seoOgTitle" TEXT,
ADD COLUMN     "seoRobotsFollow" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "seoRobotsIndex" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "seoTitle" TEXT,
ADD COLUMN     "seoTwitterCard" TEXT NOT NULL DEFAULT 'summary_large_image';
