-- Add a dedicated admin WAPI switch for payment-proof uploads.
-- Existing purchase/order WAPI behavior remains controlled by
-- StoreSettings.wapiOrderNotificationEnabled.
ALTER TABLE "StoreSettings"
ADD COLUMN "wapiPaymentProofNotificationEnabled" BOOLEAN NOT NULL DEFAULT true;
