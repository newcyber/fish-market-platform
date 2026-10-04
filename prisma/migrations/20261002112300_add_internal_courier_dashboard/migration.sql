-- Internal courier dashboard
-- Adds courier role, assignment lifecycle, and active-assignment guard.

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'COURIER';

CREATE TYPE "CourierAssignmentStatus" AS ENUM (
  'ASSIGNED',
  'ON_ROUTE',
  'PICKED_UP',
  'DELIVERED',
  'FAILED',
  'CANCELLED'
);

CREATE TABLE "CourierAssignment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "courierId" TEXT NOT NULL,
  "assignedById" TEXT,
  "status" "CourierAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "activeAssignmentKey" TEXT,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "pickedUpAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CourierAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourierAssignment_activeAssignmentKey_key"
  ON "CourierAssignment"("activeAssignmentKey");

CREATE INDEX "CourierAssignment_courierId_isActive_idx"
  ON "CourierAssignment"("courierId", "isActive");

CREATE INDEX "CourierAssignment_courierId_status_idx"
  ON "CourierAssignment"("courierId", "status");

CREATE INDEX "CourierAssignment_assignedAt_idx"
  ON "CourierAssignment"("assignedAt");

CREATE INDEX "CourierAssignment_deliveredAt_idx"
  ON "CourierAssignment"("deliveredAt");

CREATE INDEX "CourierAssignment_failedAt_idx"
  ON "CourierAssignment"("failedAt");

ALTER TABLE "CourierAssignment"
  ADD CONSTRAINT "CourierAssignment_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourierAssignment"
  ADD CONSTRAINT "CourierAssignment_courierId_fkey"
  FOREIGN KEY ("courierId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CourierAssignment"
  ADD CONSTRAINT "CourierAssignment_assignedById_fkey"
  FOREIGN KEY ("assignedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
