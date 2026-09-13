-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "cityCode" TEXT,
ADD COLUMN     "districtCode" TEXT,
ADD COLUMN     "provinceCode" TEXT,
ADD COLUMN     "villageCode" TEXT;

-- CreateIndex
CREATE INDEX "Address_provinceCode_idx" ON "Address"("provinceCode");

-- CreateIndex
CREATE INDEX "Address_cityCode_idx" ON "Address"("cityCode");

-- CreateIndex
CREATE INDEX "Address_districtCode_idx" ON "Address"("districtCode");

-- CreateIndex
CREATE INDEX "Address_villageCode_idx" ON "Address"("villageCode");
