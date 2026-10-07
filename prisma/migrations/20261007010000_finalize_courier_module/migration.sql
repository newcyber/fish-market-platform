-- Finalize PISJO Courier lifecycle and payout domain.

ALTER TYPE "CourierAssignmentStatus" ADD VALUE IF NOT EXISTS 'ARRIVED';
ALTER TYPE "CourierAssignmentEventType" ADD VALUE IF NOT EXISTS 'ARRIVED';

CREATE TYPE "CourierPayoutStatus" AS ENUM ('UNPAID', 'PAID');
CREATE TYPE "CourierPayoutPaymentMethod" AS ENUM ('CASH', 'TRANSFER');

ALTER TABLE "CourierAssignment"
  ADD COLUMN IF NOT EXISTS "arrivedAt" TIMESTAMP(3);

ALTER TABLE "CourierDeliveryProof"
  ADD COLUMN IF NOT EXISTS "proofPhotoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "proofLatitude" DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS "proofLongitude" DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS "proofTakenAt" TIMESTAMP(3);

CREATE TABLE "CourierPayout" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "courierId" TEXT NOT NULL,
  "shippingFeeCustomer" DECIMAL(12,2) NOT NULL,
  "shippingSubsidy" DECIMAL(12,2) NOT NULL,
  "courierPayout" DECIMAL(12,2) NOT NULL,
  "payoutStatus" "CourierPayoutStatus" NOT NULL DEFAULT 'UNPAID',
  "paymentMethod" "CourierPayoutPaymentMethod",
  "paidAt" TIMESTAMP(3),
  "paidById" TEXT,
  "paymentNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CourierPayout_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourierPayout_assignmentId_key" ON "CourierPayout"("assignmentId");
CREATE INDEX "CourierPayout_courierId_payoutStatus_idx" ON "CourierPayout"("courierId", "payoutStatus");
CREATE INDEX "CourierPayout_courierId_createdAt_idx" ON "CourierPayout"("courierId", "createdAt");
CREATE INDEX "CourierPayout_orderId_idx" ON "CourierPayout"("orderId");
CREATE INDEX "CourierPayout_paidAt_idx" ON "CourierPayout"("paidAt");

ALTER TABLE "CourierPayout"
  ADD CONSTRAINT "CourierPayout_assignmentId_fkey"
    FOREIGN KEY ("assignmentId") REFERENCES "CourierAssignment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourierPayout"
  ADD CONSTRAINT "CourierPayout_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourierPayout"
  ADD CONSTRAINT "CourierPayout_courierId_fkey"
    FOREIGN KEY ("courierId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CourierPayout"
  ADD CONSTRAINT "CourierPayout_paidById_fkey"
    FOREIGN KEY ("paidById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
