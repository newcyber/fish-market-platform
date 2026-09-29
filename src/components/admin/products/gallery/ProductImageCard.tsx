import Image from "next/image";
import { Film } from "lucide-react";

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
      <div className="relative aspect-square overflow-hidden bg-muted">
        {image.mediaType === "VIDEO" ? (
          <div className="relative h-full w-full">
            <video
              src={image.image}
              controls
              muted
              preload="metadata"
              playsInline
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs font-medium text-white">
              <Film className="h-3 w-3" />
              Video
            </div>
          </div>
        ) : (
          <Image
            src={image.image}
            alt="Product Image"
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            unoptimized
          />
        )}
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
            {image.mediaType === "VIDEO"
              ? `Video #${image.sortOrder + 1}`
              : image.isThumbnail
                ? "Thumbnail"
                : `#${image.sortOrder + 1}`}
          </Badge>
        </div>

        {image.mediaType !== "VIDEO" && (
          <SetThumbnailButton
            imageId={image.id}
            productId={productId}
            isThumbnail={image.isThumbnail}
          />
        )}

        <DeleteImageButton
          imageId={image.id}
          productId={productId}
        />
      </div>
    </Card>
  );
}