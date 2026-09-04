-- ============================================================
-- ADD USER OWNERSHIP TO NOTIFICATION
-- ============================================================
--
-- Existing notifications were created before Notification
-- became user-scoped.
--
-- Historical notifications are assigned to the primary
-- SUPER_ADMIN account:
--
-- admin@fishmarket.local
--
-- ============================================================

-- 1. Add userId as nullable first so existing rows remain valid.
ALTER TABLE "Notification"
ADD COLUMN "userId" TEXT;

-- 2. Backfill existing notifications.
UPDATE "Notification"
SET "userId" = 'dddd60c9-a468-4834-8b50-2fb4b58dcd88'
WHERE "userId" IS NULL;

-- 3. userId must now be present for every notification.
ALTER TABLE "Notification"
ALTER COLUMN "userId" SET NOT NULL;

-- 4. Add foreign key to User.
ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- 5. User-scoped indexes.
CREATE INDEX "Notification_userId_idx"
ON "Notification"("userId");

CREATE INDEX "Notification_userId_isRead_idx"
ON "Notification"("userId", "isRead");

CREATE INDEX "Notification_userId_createdAt_idx"
ON "Notification"("userId", "createdAt");
