-- Global admin kill switch for customer transactional WhatsApp notifications.
ALTER TABLE "StoreSettings"
ADD COLUMN "wapiCustomerNotificationEnabled" BOOLEAN NOT NULL DEFAULT true;
