import { prisma } from "@/lib/prisma";

import { StorageService } from "@/services/storage/storage.service";

import {
  ProductImageSchema,
} from "@/validators/product/image.schema";

export class ProductImageService {
  /**
   * Upload satu atau banyak gambar.
   */
  static async upload(
    productId: string,
    files: File[]
  ) {
    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },

        select: {
          id: true,
        },
      });

    if (!product) {
      throw new Error(
        "Produk tidak ditemukan."
      );
    }

    if (files.length === 0) {
      throw new Error(
        "Pilih minimal satu gambar."
      );
    }

    for (const file of files) {
      const validation =
        ProductImageSchema.safeParse(
          file
        );

      if (!validation.success) {
        throw new Error(
          validation.error.issues[0]
            ?.message ??
            "File gambar tidak valid."
        );
      }
    }

    const existingImages =
      await prisma.productImage.count({
        where: {
          productId,
        },
      });

    let sortOrder =
      existingImages;

    const hasThumbnail =
      existingImages > 0;

    const uploadedImages = [];

    for (const file of files) {
      const imagePath =
        await StorageService.save(
          file
        );

      const image =
        await prisma.productImage.create({
          data: {
            productId,

            image: imagePath,

            sortOrder,

            isThumbnail:
              !hasThumbnail &&
              sortOrder === 0,
          },
        });

      uploadedImages.push(image);

      sortOrder++;
    }

    return uploadedImages;
  }

    /**
   * Hapus gambar.
   *
   * Enterprise Hardening V3
   *
   * - Auto thumbnail recovery
   * - Database sebagai source of truth
   * - Transaction safety
   * - Storage cleanup setelah commit
   */
  static async delete(
    imageId: string
  ) {
    const image =
      await prisma.productImage.findUnique({
        where: {
          id: imageId,
        },

        select: {
          id: true,
          image: true,
          productId: true,
          isThumbnail: true,
          sortOrder: true,
        },
      });

    if (!image) {
      throw new Error(
        "Gambar tidak ditemukan."
      );
    }

    await prisma.$transaction(
      async (tx) => {
        /**
         * Jika gambar yang dihapus
         * adalah thumbnail,
         * pilih thumbnail baru.
         */
        if (image.isThumbnail) {
          const nextThumbnail =
            await tx.productImage.findFirst({
              where: {
                productId:
                  image.productId,

                id: {
                  not: image.id,
                },
              },

              orderBy: {
                sortOrder: "asc",
              },

              select: {
                id: true,
              },
            });

          if (nextThumbnail) {
            await tx.productImage.update({
              where: {
                id: nextThumbnail.id,
              },

              data: {
                isThumbnail: true,
              },
            });
          }
        }

        /**
         * Hapus record database.
         */
        await tx.productImage.delete({
          where: {
            id: image.id,
          },
        });
      }
    );

    /**
     * Storage dibersihkan
     * setelah database berhasil commit.
     *
     * Jika gagal menghapus file,
     * database tetap konsisten.
     */
    try {
      await StorageService.delete(
        image.image
      );
    } catch (error) {
      console.error(
        "[ProductImageService] Failed to delete image from storage:",
        image.image,
        error
      );
    }

    return true;
  }

  /**
   * Jadikan thumbnail.
   */
  static async setThumbnail(
    imageId: string
  ) {
    const image =
      await prisma.productImage.findUnique({
        where: {
          id: imageId,
        },
      });

    if (!image) {
      throw new Error(
        "Gambar tidak ditemukan."
      );
    }

    await prisma.$transaction([
      prisma.productImage.updateMany({
        where: {
          productId:
            image.productId,
        },

        data: {
          isThumbnail: false,
        },
      }),

      prisma.productImage.update({
        where: {
          id: imageId,
        },

        data: {
          isThumbnail: true,
        },
      }),
    ]);

    return true;
  }

    /**
   * Update urutan gambar.
   *
   * Enterprise Hardening V2
   *
   * - Memastikan seluruh imageIds milik productId.
   * - Menolak request jika ada gambar dari produk lain.
   * - Seluruh update dilakukan dalam satu transaction.
   */
  static async reorder(
    productId: string,
    imageIds: string[]
  ) {
    if (imageIds.length === 0) {
      return true;
    }

    /**
     * Ambil seluruh gambar berdasarkan
     * productId yang diminta.
     */
    const images =
      await prisma.productImage.findMany({
        where: {
          productId,

          id: {
            in: imageIds,
          },
        },

        select: {
          id: true,
        },
      });

    /**
     * Jika jumlah gambar yang ditemukan
     * tidak sama dengan imageIds yang dikirim,
     * berarti ada gambar yang bukan milik produk ini.
     */
    if (
      images.length !==
      imageIds.length
    ) {
      throw new Error(
        "Terdapat gambar yang bukan milik produk ini."
      );
    }

    /**
     * Update seluruh sortOrder
     * dalam satu transaction.
     */
    await prisma.$transaction(
      imageIds.map(
        (imageId, index) =>
          prisma.productImage.update({
            where: {
              id: imageId,
            },

            data: {
              sortOrder: index,
            },
          })
      )
    );

    return true;
  }

    /**
   * Ambil gallery.
   *
   * Enterprise Optimized
   */
  static async getGallery(
    productId: string
  ) {
    return prisma.productImage.findMany({
      where: {
        productId,
      },

      orderBy: {
        sortOrder: "asc",
      },

      select: {
        id: true,
        image: true,
        sortOrder: true,
        isThumbnail: true,
      },
    });
  }

  /**
   * Hapus seluruh gambar milik produk.
   *
   * Enterprise Hardening V3
   *
   * Digunakan ketika:
   * - Produk dihapus
   * - Force delete
   * - Bulk import
   * - Seeder rollback
   */
  static async deleteAllByProduct(
    productId: string
  ) {
    const images =
      await prisma.productImage.findMany({
        where: {
          productId,
        },

        select: {
          image: true,
        },
      });

    if (images.length === 0) {
      return true;
    }

    /**
     * Database adalah source of truth.
     * Hapus seluruh record terlebih dahulu.
     */
    await prisma.productImage.deleteMany({
      where: {
        productId,
      },
    });

    /**
     * Bersihkan file di storage.
     * Kegagalan menghapus satu file
     * tidak membatalkan proses lainnya.
     */
    await Promise.allSettled(
      images.map((image) =>
        StorageService.delete(image.image)
      )
    );

    return true;
  }
}

export default ProductImageService;