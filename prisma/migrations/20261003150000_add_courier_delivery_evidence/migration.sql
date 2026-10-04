-- Courier delivery evidence and audit trail

CREATE TYPE "CourierAssignmentEventType" AS ENUM (
  'ASSIGNED',
  'REASSIGNED',
  'ON_ROUTE',
  'PICKED_UP',
  'DELIVERED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "CourierFailureCode" AS ENUM (
  'CUSTOMER_UNAVAILABLE',
  'WRONG_ADDRESS',
  'ADDRESS_NOT_FOUND',
  'CUSTOMER_REFUSED',
  'CUSTOMER_CANCELLED',
  'DAMAGED_PACKAGE',
  'VEHICLE_PROBLEM',
  'WEATHER',
  'OTHER'
);

CREATE TABLE "CourierAssignmentEvent" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "actorId" TEXT,
  "type" "CourierAssignmentEventType" NOT NULL,
  "fromStatus" "CourierAssignmentStatus",
  "toStatus" "CourierAssignmentStatus",
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CourierAssignmentEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourierDeliveryProof" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "recipientName" TEXT NOT NULL,
  "recipientNote" TEXT,
  "photoUrl" TEXT,
  "latitude" DECIMAL(10,7),
  "longitude" DECIMAL(10,7),
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourierDeliveryProof_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CourierAssignment" ADD COLUMN "failureCode" "CourierFailureCode";

CREATE UNIQUE INDEX "CourierDeliveryProof_assignmentId_key" ON "CourierDeliveryProof"("assignmentId");
CREATE INDEX "CourierAssignmentEvent_assignmentId_createdAt_idx" ON "CourierAssignmentEvent"("assignmentId", "createdAt");
CREATE INDEX "CourierAssignmentEvent_actorId_createdAt_idx" ON "CourierAssignmentEvent"("actorId", "createdAt");
CREATE INDEX "CourierAssignmentEvent_type_createdAt_idx" ON "CourierAssignmentEvent"("type", "createdAt");
CREATE INDEX "CourierDeliveryProof_createdById_idx" ON "CourierDeliveryProof"("createdById");
CREATE INDEX "CourierDeliveryProof_capturedAt_idx" ON "CourierDeliveryProof"("capturedAt");
CREATE INDEX "CourierAssignment_failureCode_idx" ON "CourierAssignment"("failureCode");

ALTER TABLE "CourierAssignmentEvent"
  ADD CONSTRAINT "CourierAssignmentEvent_assignmentId_fkey"
  FOREIGN KEY ("assignmentId") REFERENCES "CourierAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourierAssignmentEvent"
  ADD CONSTRAINT "CourierAssignmentEvent_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CourierDeliveryProof"
  ADD CONSTRAINT "CourierDeliveryProof_assignmentId_fkey"
  FOREIGN KEY ("assignmentId") REFERENCES "CourierAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourierDeliveryProof"
  ADD CONSTRAINT "CourierDeliveryProof_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
