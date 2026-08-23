import Image from "next/image";

import SetThumbnailButton from "@/components/admin/products/SetThumbnailButton";
import DeleteImageButton from "@/components/admin/products/DeleteImageButton";

import { Images } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
    <Card className="space-y-5 p-4 sm:space-y-6 sm:p-6">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Images className="h-5 w-5 shrink-0" />

          <span>
            Gallery Produk
          </span>
        </h2>

        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Kelola gambar produk yang
          sudah tersimpan.
        </p>
      </div>

      {/* ====================================================== */}
      {/* EMPTY STATE */}
      {/* ====================================================== */}

      {totalImages === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed px-4 py-10 text-center sm:min-h-48 sm:px-6 sm:py-16">
          <Images className="mb-4 h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />

          <h3 className="font-medium">
            Belum ada gambar
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Upload gambar baru melalui
            bagian Gambar Produk di
            bawah/atas form produk.
          </p>
        </div>
      ) : (
        <>
          {/* ================================================== */}
          {/* COUNTER */}
          {/* ================================================== */}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge
              variant="secondary"
              className="whitespace-nowrap"
            >
              {totalImages}{" "}
              {totalImages === 1
                ? "Gambar"
                : "Gambar"}
            </Badge>

            <span className="text-xs text-muted-foreground">
              Gambar tersimpan
            </span>
          </div>

          {/* ================================================== */}
          {/* GALLERY */}
          {/* ================================================== */}

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
            {images.map(
              (image) => (
                <Card
                  key={image.id}
                  className="min-w-0 overflow-hidden p-0 transition-shadow hover:shadow-lg"
                >
                  {/* ======================================== */}
                  {/* IMAGE */}
                  {/* ======================================== */}

                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={image.image}
                      alt="Gambar produk"
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      className="object-cover transition-transform duration-300 hover:scale-105"
                      unoptimized
                    />
                  </div>

                  {/* ======================================== */}
                  {/* INFORMATION + ACTIONS */}
                  {/* ======================================== */}

                  <div className="space-y-3 p-2.5 sm:p-3">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <Badge
                        variant={
                          image.isThumbnail
                            ? "default"
                            : "secondary"
                        }
                        className="max-w-full truncate"
                      >
                        {image.isThumbnail
                          ? "Thumbnail"
                          : `#${image.sortOrder + 1}`}
                      </Badge>
                    </div>

                    {/* ====================================== */}
                    {/* SET THUMBNAIL */}
                    {/* ====================================== */}

                    <div className="w-full">
                      <SetThumbnailButton
                        imageId={
                          image.id
                        }
                        productId={
                          productId
                        }
                        isThumbnail={
                          image.isThumbnail
                        }
                      />
                    </div>

                    {/* ====================================== */}
                    {/* DELETE */}
                    {/* ====================================== */}

                    <div className="w-full">
                      <DeleteImageButton
                        imageId={
                          image.id
                        }
                        productId={
                          productId
                        }
                      />
                    </div>
                  </div>
                </Card>
              )
            )}
          </div>
        </>
      )}
    </Card>
  );
}