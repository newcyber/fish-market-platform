-- AlterTable
ALTER TABLE "CourierAssignment" ADD COLUMN     "slaAssignmentToStartMinutes" INTEGER,
ADD COLUMN     "slaPickupToDeliveryMinutes" INTEGER,
ADD COLUMN     "slaStartToPickupMinutes" INTEGER,
ADD COLUMN     "slaTotalDeliveryMinutes" INTEGER;
