-- CreateEnum
CREATE TYPE "PaymentChannelType" AS ENUM ('BANK_TRANSFER');

-- CreateTable
CREATE TABLE "PaymentChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "PaymentChannelType" NOT NULL DEFAULT 'BANK_TRANSFER',
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountHolder" TEXT,
    "instructions" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentChannel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentChannel_slug_key" ON "PaymentChannel"("slug");

-- CreateIndex
CREATE INDEX "PaymentChannel_isActive_idx" ON "PaymentChannel"("isActive");

-- CreateIndex
CREATE INDEX "PaymentChannel_type_idx" ON "PaymentChannel"("type");

-- CreateIndex
CREATE INDEX "PaymentChannel_sortOrder_idx" ON "PaymentChannel"("sortOrder");
