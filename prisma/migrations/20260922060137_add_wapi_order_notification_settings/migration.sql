-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "wapiOrderNotificationEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "wapiOrderNotificationTemplate" TEXT;
