-- Add independent admin switches for customer transactional WhatsApp events.
ALTER TABLE "StoreSettings"
  ADD COLUMN "wapiCustomerOrderCreatedEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "wapiCustomerOrderStatusEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "wapiCustomerPaymentVerifiedEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "wapiCustomerPaymentRejectedEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "wapiCustomerRewardPointsEnabled" BOOLEAN NOT NULL DEFAULT true;
