-- Add configurable signup bonus points.
ALTER TABLE "RewardPointSettings"
ADD COLUMN "signupBonusPoints" INTEGER NOT NULL DEFAULT 100;

-- Add an idempotency key for non-order reward transactions.
-- NULL remains allowed for existing order-based transactions.
ALTER TABLE "RewardPointTransaction"
ADD COLUMN "referenceKey" TEXT;

CREATE UNIQUE INDEX "RewardPointTransaction_referenceKey_key"
ON "RewardPointTransaction"("referenceKey");
