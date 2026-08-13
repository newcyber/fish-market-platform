import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import SetThumbnailButton from "@/components/admin/products/SetThumbnailButton";
import DeleteImageButton from "@/components/admin/products/DeleteImageButton";

import type { ProductImage } from "@/types/product";

interface ProductImageCardProps {
  productId: string;

  image: ProductImage;
}

export default function ProductImageCard({
  productId,
  image,
}: ProductImageCardProps) {
  return (
    <Card className="overflow-hidden p-0 transition-shadow hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={image.image}
          alt="Product Image"
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
          unoptimized
        />
      </div>

      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between">
          <Badge
            variant={
              image.isThumbnail
                ? "default"
                : "secondary"
            }
          >
            {image.isThumbnail
              ? "Thumbnail"
              : `#${image.sortOrder + 1}`}
          </Badge>
        </div>

        <SetThumbnailButton
          imageId={image.id}
          productId={productId}
          isThumbnail={image.isThumbnail}
        />

        <DeleteImageButton
          imageId={image.id}
          productId={productId}
        />
      </div>
    </Card>
  );
}