import Image from "next/image";

import ImageUploadPanel from "@/components/admin/products/upload/ImageUploadPanel";

import SetThumbnailButton from "@/components/admin/products/SetThumbnailButton";

import DeleteImageButton from "@/components/admin/products/DeleteImageButton";

import { Images } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type {
  ProductImage,
} from "@/types/product";

interface ProductGalleryProps {
  productId: string;

  images: ProductImage[];
}

export default function ProductGallery({
  productId,
  images,
}: ProductGalleryProps) {
  const totalImages =
    images.length;

  return (
    <Card className="space-y-6 p-6">

      {/* Header */}

      <div>
        <h2 className="text-lg font-semibold">
          Gallery Produk
        </h2>

        <p className="text-sm text-muted-foreground">
          Kelola seluruh gambar
          produk.
        </p>
      </div>

      {/* Upload */}

      <ImageUploadPanel
        productId={productId}
      />

      {/* Empty */}

      {totalImages === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">

          <Images className="mb-4 h-12 w-12 text-muted-foreground" />

          <h3 className="font-medium">
            Belum ada gambar
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Upload gambar pertama
            untuk produk ini.
          </p>

        </div>
      ) : (
        <>

          {/* Counter */}

          <div className="flex items-center justify-between">

            <Badge variant="secondary">
              {totalImages} Gambar
            </Badge>

          </div>

          {/* Gallery */}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">

            {images.map((image) => (
              <Card
                key={image.id}
                className="overflow-hidden p-0 transition-shadow hover:shadow-lg"
              >

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
            ))}

          </div>

        </>
      )}

    </Card>
  );
}