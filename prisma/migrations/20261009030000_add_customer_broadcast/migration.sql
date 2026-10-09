-- Customer broadcast infrastructure

CREATE TYPE "BroadcastStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PARTIAL', 'FAILED', 'CANCELLED');
CREATE TYPE "BroadcastAudienceType" AS ENUM ('ALL_CUSTOMERS', 'SELECTED_CUSTOMERS');
CREATE TYPE "BroadcastChannel" AS ENUM ('IN_APP');
CREATE TYPE "BroadcastRecipientStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');
CREATE TYPE "BroadcastSourceType" AS ENUM ('CUSTOM', 'PROMOTION', 'FLASH_SALE');

CREATE TABLE "Broadcast" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "imageUrl" TEXT,
    "href" TEXT,
    "status" "BroadcastStatus" NOT NULL DEFAULT 'DRAFT',
    "audienceType" "BroadcastAudienceType" NOT NULL DEFAULT 'ALL_CUSTOMERS',
    "channel" "BroadcastChannel" NOT NULL DEFAULT 'IN_APP',
    "sourceType" "BroadcastSourceType" NOT NULL DEFAULT 'CUSTOM',
    "sourceKey" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BroadcastRecipient" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationId" TEXT,
    "status" "BroadcastRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BroadcastRecipient_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Notification" ADD COLUMN "broadcastId" TEXT;

CREATE UNIQUE INDEX "Broadcast_sourceKey_key" ON "Broadcast"("sourceKey");
CREATE INDEX "Broadcast_status_scheduledAt_idx" ON "Broadcast"("status", "scheduledAt");
CREATE INDEX "Broadcast_createdById_createdAt_idx" ON "Broadcast"("createdById", "createdAt");
CREATE INDEX "Broadcast_sourceType_idx" ON "Broadcast"("sourceType");

CREATE UNIQUE INDEX "BroadcastRecipient_notificationId_key" ON "BroadcastRecipient"("notificationId");
CREATE UNIQUE INDEX "BroadcastRecipient_broadcastId_userId_key" ON "BroadcastRecipient"("broadcastId", "userId");
CREATE INDEX "BroadcastRecipient_broadcastId_status_idx" ON "BroadcastRecipient"("broadcastId", "status");
CREATE INDEX "BroadcastRecipient_userId_createdAt_idx" ON "BroadcastRecipient"("userId", "createdAt");
CREATE INDEX "Notification_broadcastId_idx" ON "Notification"("broadcastId");

ALTER TABLE "Broadcast"
  ADD CONSTRAINT "Broadcast_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BroadcastRecipient"
  ADD CONSTRAINT "BroadcastRecipient_broadcastId_fkey"
  FOREIGN KEY ("broadcastId") REFERENCES "Broadcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BroadcastRecipient"
  ADD CONSTRAINT "BroadcastRecipient_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BroadcastRecipient"
  ADD CONSTRAINT "BroadcastRecipient_notificationId_fkey"
  FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_broadcastId_fkey"
  FOREIGN KEY ("broadcastId") REFERENCES "Broadcast"("id") ON DELETE SET NULL ON UPDATE CASCADE;
