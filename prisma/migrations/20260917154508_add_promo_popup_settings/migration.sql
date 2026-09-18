-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "promoPopupAlt" TEXT,
ADD COLUMN     "promoPopupDelay" INTEGER NOT NULL DEFAULT 1200,
ADD COLUMN     "promoPopupEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promoPopupHref" TEXT,
ADD COLUMN     "promoPopupImage" TEXT,
ADD COLUMN     "promoPopupRememberClose" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "promoPopupVersion" TEXT;
