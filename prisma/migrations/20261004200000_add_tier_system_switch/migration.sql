-- Add a non-destructive global switch for the member tier system.
ALTER TABLE "StoreSettings"
ADD COLUMN "tierSystemEnabled" BOOLEAN NOT NULL DEFAULT true;
