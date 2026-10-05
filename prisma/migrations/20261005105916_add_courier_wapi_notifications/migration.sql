-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "wapiCourierAssignmentEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "wapiCourierNotificationEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "WapiCourierDelivery" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "courierId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "WapiDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "messageId" TEXT,
    "jid" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "processingStartedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WapiCourierDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WapiCourierDelivery_eventKey_key" ON "WapiCourierDelivery"("eventKey");

-- CreateIndex
CREATE INDEX "WapiCourierDelivery_assignmentId_createdAt_idx" ON "WapiCourierDelivery"("assignmentId", "createdAt");

-- CreateIndex
CREATE INDEX "WapiCourierDelivery_courierId_createdAt_idx" ON "WapiCourierDelivery"("courierId", "createdAt");

-- CreateIndex
CREATE INDEX "WapiCourierDelivery_orderId_createdAt_idx" ON "WapiCourierDelivery"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "WapiCourierDelivery_status_createdAt_idx" ON "WapiCourierDelivery"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WapiCourierDelivery_eventType_createdAt_idx" ON "WapiCourierDelivery"("eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "WapiCourierDelivery" ADD CONSTRAINT "WapiCourierDelivery_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "CourierAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WapiCourierDelivery" ADD CONSTRAINT "WapiCourierDelivery_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WapiCourierDelivery" ADD CONSTRAINT "WapiCourierDelivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
