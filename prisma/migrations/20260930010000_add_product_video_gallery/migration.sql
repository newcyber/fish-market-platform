-- Add video support to the existing product gallery without replacing legacy image rows.
CREATE TYPE "ProductMediaType" AS ENUM ('IMAGE', 'VIDEO');

ALTER TABLE "ProductImage"
ADD COLUMN "mediaType" "ProductMediaType" NOT NULL DEFAULT 'IMAGE';

CREATE INDEX "ProductImage_productId_mediaType_idx"
ON "ProductImage"("productId", "mediaType");

CREATE INDEX "ProductImage_productId_sortOrder_idx"
ON "ProductImage"("productId", "sortOrder");
