import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  prisma,
} from "@/lib/prisma";

/**
 * ============================================================
 * PARAMS
 * ============================================================
 */

interface RouteContext {
  params: Promise<{
    id: string;

    itemId: string;
  }>;
}

/**
 * ============================================================
 * PATCH
 * UPDATE FLASH SALE ITEM
 * ============================================================
 */

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const {
      id: flashSaleId,
      itemId,
    } = await context.params;

    const body =
      await request.json();

    const {
      flashPrice,
      stockLimit,
      perUserLimit,
      sortOrder,
      isActive,
    } = body;

    /**
     * ==========================================================
     * FIND EXISTING ITEM
     * ==========================================================
     */

    const existingItem =
      await prisma.flashSaleItem.findFirst({
        where: {
          id: itemId,

          flashSaleId,
        },

        select: {
          id: true,

          originalPrice: true,

          flashPrice: true,

          stockLimit: true,

          soldQuantity: true,

          perUserLimit: true,

          sortOrder: true,

          isActive: true,
        },
      });

    if (!existingItem) {
      return NextResponse.json(
        {
          message:
            "Item Flash Sale tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    /**
     * ==========================================================
     * RESOLVE FINAL VALUES
     * ==========================================================
     *
     * Nilai final digunakan untuk validasi relasi
     * antar-field.
     *
     * Jika suatu field tidak dikirim, gunakan
     * nilai lama dari database.
     */

    const finalFlashPrice =
      flashPrice !== undefined
        ? Number(flashPrice)
        : Number(
            existingItem.flashPrice
          );

    const finalStockLimit =
      stockLimit !== undefined
        ? Number(stockLimit)
        : existingItem.stockLimit;

    const finalPerUserLimit =
      perUserLimit !== undefined
        ? Number(perUserLimit)
        : existingItem.perUserLimit;

    const finalSortOrder =
      sortOrder !== undefined
        ? Number(sortOrder)
        : existingItem.sortOrder;

    /**
     * ==========================================================
     * VALIDATE FLASH PRICE
     * ==========================================================
     */

    if (
      !Number.isFinite(
        finalFlashPrice
      ) ||
      finalFlashPrice < 0
    ) {
      return NextResponse.json(
        {
          message:
            "Harga Flash Sale tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      finalFlashPrice >=
      Number(
        existingItem.originalPrice
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Harga Flash Sale harus lebih rendah dari harga normal.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ==========================================================
     * VALIDATE STOCK LIMIT
     * ==========================================================
     */

    if (
      !Number.isInteger(
        finalStockLimit
      ) ||
      finalStockLimit < 1
    ) {
      return NextResponse.json(
        {
          message:
            "Stock limit minimal adalah 1.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ==========================================================
     * PREVENT STOCK BELOW SOLD QUANTITY
     * ==========================================================
     */

    if (
      finalStockLimit <
      existingItem.soldQuantity
    ) {
      return NextResponse.json(
        {
          message:
            `Stock limit tidak boleh lebih kecil dari jumlah yang sudah terjual (${existingItem.soldQuantity}).`,
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ==========================================================
     * VALIDATE PER USER LIMIT
     * ==========================================================
     */

    if (
      finalPerUserLimit === null ||
      finalPerUserLimit === undefined
    ) {
      return NextResponse.json(
        {
          message:
            "Batas pembelian per user tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        finalPerUserLimit
      ) ||
      finalPerUserLimit < 1
    ) {
      return NextResponse.json(
        {
          message:
            "Batas pembelian per user minimal adalah 1.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ==========================================================
     * PREVENT PER USER LIMIT ABOVE STOCK
     * ==========================================================
     */

    if (
      finalPerUserLimit >
      finalStockLimit
    ) {
      return NextResponse.json(
        {
          message:
            "Batas pembelian per user tidak boleh lebih besar dari stock limit.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ==========================================================
     * VALIDATE SORT ORDER
     * ==========================================================
     */

    if (
      !Number.isInteger(
        finalSortOrder
      ) ||
      finalSortOrder < 0
    ) {
      return NextResponse.json(
        {
          message:
            "Sort order tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ==========================================================
     * BUILD UPDATE DATA
     * ==========================================================
     */

    const data: {
      flashPrice?: number;

      stockLimit?: number;

      perUserLimit?: number;

      sortOrder?: number;

      isActive?: boolean;
    } = {};

    if (
      flashPrice !== undefined
    ) {
      data.flashPrice =
        finalFlashPrice;
    }

    if (
      stockLimit !== undefined
    ) {
      data.stockLimit =
        finalStockLimit;
    }

    if (
      perUserLimit !== undefined
    ) {
      data.perUserLimit =
        finalPerUserLimit;
    }

    if (
      sortOrder !== undefined
    ) {
      data.sortOrder =
        finalSortOrder;
    }

    if (
      typeof isActive ===
      "boolean"
    ) {
      data.isActive =
        isActive;
    }

    /**
     * ==========================================================
     * CHECK UPDATE DATA
     * ==========================================================
     */

    if (
      Object.keys(data).length ===
      0
    ) {
      return NextResponse.json(
        {
          message:
            "Tidak ada data yang diperbarui.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ==========================================================
     * UPDATE ITEM
     * ==========================================================
     */

    const item =
      await prisma.flashSaleItem.update({
        where: {
          id: itemId,
        },

        data,

        include: {
          product: {
            select: {
              id: true,

              name: true,
            },
          },

          weightOption: {
            select: {
              id: true,

              label: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        message:
          "Item Flash Sale berhasil diperbarui.",

        data: item,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "[FLASH_SALE_ITEM_PATCH]",
      error
    );

    return NextResponse.json(
      {
        message:
          "Terjadi kesalahan saat memperbarui item Flash Sale.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * ============================================================
 * DELETE
 * DELETE FLASH SALE ITEM
 * ============================================================
 */

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const {
      id: flashSaleId,
      itemId,
    } = await context.params;

    /**
     * ==========================================================
     * CHECK ITEM
     * ==========================================================
     */

    const existingItem =
      await prisma.flashSaleItem.findFirst({
        where: {
          id: itemId,

          flashSaleId,
        },

        select: {
          id: true,

          soldQuantity: true,
        },
      });

    if (!existingItem) {
      return NextResponse.json(
        {
          message:
            "Item Flash Sale tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    /**
     * ==========================================================
     * SAFETY CHECK
     * ==========================================================
     *
     * Item yang sudah memiliki penjualan
     * tidak boleh dihapus agar histori
     * Flash Sale tetap konsisten.
     */

    if (
      existingItem.soldQuantity > 0
    ) {
      return NextResponse.json(
        {
          message:
            "Item yang sudah memiliki penjualan tidak dapat dihapus. Nonaktifkan item jika ingin menghentikan Flash Sale.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ==========================================================
     * DELETE
     * ==========================================================
     */

    await prisma.flashSaleItem.delete({
      where: {
        id: itemId,
      },
    });

    return NextResponse.json(
      {
        message:
          "Item Flash Sale berhasil dihapus.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "[FLASH_SALE_ITEM_DELETE]",
      error
    );

    return NextResponse.json(
      {
        message:
          "Terjadi kesalahan saat menghapus item Flash Sale.",
      },
      {
        status: 500,
      }
    );
  }
}