-- CreateTable
CREATE TABLE "CourierSlaSettings" (
    "id" TEXT NOT NULL,
    "assignmentToStartMinutes" INTEGER NOT NULL DEFAULT 15,
    "startToPickupMinutes" INTEGER NOT NULL DEFAULT 30,
    "pickupToDeliveryMinutes" INTEGER NOT NULL DEFAULT 60,
    "totalDeliveryMinutes" INTEGER NOT NULL DEFAULT 105,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "CourierSlaSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourierSlaSettings_isActive_idx" ON "CourierSlaSettings"("isActive");

-- CreateIndex
CREATE INDEX "CourierSlaSettings_updatedById_idx" ON "CourierSlaSettings"("updatedById");

-- AddForeignKey
ALTER TABLE "CourierSlaSettings"
ADD CONSTRAINT "CourierSlaSettings_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
