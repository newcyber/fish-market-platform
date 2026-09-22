-- CreateEnum
CREATE TYPE "WapiDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "WapiDelivery" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "WapiDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "messageId" TEXT,
    "jid" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WapiDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WapiDelivery_status_idx" ON "WapiDelivery"("status");

-- CreateIndex
CREATE INDEX "WapiDelivery_orderId_idx" ON "WapiDelivery"("orderId");

-- CreateIndex
CREATE INDEX "WapiDelivery_userId_idx" ON "WapiDelivery"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WapiDelivery_orderId_userId_key" ON "WapiDelivery"("orderId", "userId");

-- AddForeignKey
ALTER TABLE "WapiDelivery" ADD CONSTRAINT "WapiDelivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WapiDelivery" ADD CONSTRAINT "WapiDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
