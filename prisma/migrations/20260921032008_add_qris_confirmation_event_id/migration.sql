/*
  Warnings:

  - A unique constraint covering the columns `[confirmationEventId]` on the table `PaymentProof` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PaymentProof" ADD COLUMN     "confirmationEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PaymentProof_confirmationEventId_key" ON "PaymentProof"("confirmationEventId");
