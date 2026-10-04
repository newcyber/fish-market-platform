-- CreateTable
CREATE TABLE "WapiCustomerAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "deliveryId" TEXT,
    "action" TEXT NOT NULL,
    "settingKey" TEXT,
    "eventType" TEXT,
    "fromStatus" "WapiDeliveryStatus",
    "toStatus" "WapiDeliveryStatus",
    "previousValue" JSONB,
    "newValue" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WapiCustomerAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WapiCustomerAuditLog_actorId_createdAt_idx"
ON "WapiCustomerAuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "WapiCustomerAuditLog_deliveryId_createdAt_idx"
ON "WapiCustomerAuditLog"("deliveryId", "createdAt");

-- CreateIndex
CREATE INDEX "WapiCustomerAuditLog_action_createdAt_idx"
ON "WapiCustomerAuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "WapiCustomerAuditLog_settingKey_createdAt_idx"
ON "WapiCustomerAuditLog"("settingKey", "createdAt");

-- AddForeignKey
ALTER TABLE "WapiCustomerAuditLog"
ADD CONSTRAINT "WapiCustomerAuditLog_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WapiCustomerAuditLog"
ADD CONSTRAINT "WapiCustomerAuditLog_deliveryId_fkey"
FOREIGN KEY ("deliveryId") REFERENCES "WapiCustomerDelivery"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
