import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/auth/admin";

import FlashSaleItemService from "@/services/flash-sale/flash-sale-item.service";

/**
 * ============================================================
 * ROUTE CONTEXT
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
 * ERROR RESPONSE
 * ============================================================
 */

function getErrorResponse(
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : "Terjadi kesalahan pada item Flash Sale.";

  /**
   * ----------------------------------------------------------
   * NOT FOUND
   * ----------------------------------------------------------
   */

  if (
    message ===
      "Flash Sale tidak ditemukan." ||
    message ===
      "Item Flash Sale tidak ditemukan." ||
    message ===
      "Produk tidak ditemukan."
  ) {
    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 404,
      }
    );
  }

  /**
   * ----------------------------------------------------------
   * BUSINESS VALIDATION
   * ----------------------------------------------------------
   */

  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status: 400,
    }
  );
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
    /**
     * --------------------------------------------------------
     * ADMIN AUTHORIZATION
     * --------------------------------------------------------
     */

    await requireAdmin();

    const {
      id: flashSaleId,
      itemId,
    } = await context.params;

    if (
      !flashSaleId?.trim() ||
      !itemId?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Flash Sale ID dan Item ID wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * PARSE BODY
     * --------------------------------------------------------
     */

    const body =
      await request.json();

    if (
      !body ||
      typeof body !==
        "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Request body tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      productId,
      skuId,
      originalPrice,
      flashPrice,
      stockLimit,
      perUserLimit,
      sortOrder,
      isActive,
    } =
      body as Record<
        string,
        unknown
      >;

    /**
     * --------------------------------------------------------
     * NORMALIZE INPUT
     * --------------------------------------------------------
     */

    const input: {
      productId?: string;
      skuId?: string;
      originalPrice?: number;
      flashPrice?: number;
      stockLimit?: number;
      perUserLimit?: number;
      sortOrder?: number;
      isActive?: boolean;
    } = {};

    /**
     * --------------------------------------------------------
     * PRODUCT
     * --------------------------------------------------------
     */

    if (
      productId !==
      undefined
    ) {
      if (
        typeof productId !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Product ID tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      const normalizedProductId =
        productId.trim();

      if (
        !normalizedProductId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Product ID tidak boleh kosong.",
          },
          {
            status: 400,
          }
        );
      }

      input.productId =
        normalizedProductId;
    }

    /**
     * --------------------------------------------------------
     * SKU
     * --------------------------------------------------------
     *
     * Canonical sellable SKU.
     *
     * Jika skuId tidak dikirim:
     * - Service akan mempertahankan SKU existing.
     *
     * Jika skuId dikirim:
     * - Service akan mengganti SKU setelah
     *   memastikan SKU tersebut milik product.
     *
     * SKU tidak boleh null.
     */

    if (
      skuId !==
      undefined
    ) {
      if (
        typeof skuId !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "SKU ID tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      const normalizedSkuId =
        skuId.trim();

      if (
        !normalizedSkuId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "SKU ID tidak boleh kosong.",
          },
          {
            status: 400,
          }
        );
      }

      input.skuId =
        normalizedSkuId;
    }

    /**
     * --------------------------------------------------------
     * ORIGINAL PRICE
     * --------------------------------------------------------
     *
     * Field ini hanya compatibility/audit.
     * Harga canonical tetap ditentukan oleh service
     * berdasarkan ProductSku.
     */

    if (
      originalPrice !==
      undefined
    ) {
      const value =
        Number(
          originalPrice
        );

      if (
        !Number.isFinite(
          value
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Harga normal tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      input.originalPrice =
        value;
    }

    /**
     * --------------------------------------------------------
     * FLASH PRICE
     * --------------------------------------------------------
     */

    if (
      flashPrice !==
      undefined
    ) {
      const value =
        Number(
          flashPrice
        );

      if (
        !Number.isFinite(
          value
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Harga Flash Sale tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      input.flashPrice =
        value;
    }

    /**
     * --------------------------------------------------------
     * STOCK LIMIT
     * --------------------------------------------------------
     */

    if (
      stockLimit !==
      undefined
    ) {
      const value =
        Number(
          stockLimit
        );

      if (
        !Number.isInteger(
          value
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Stock limit harus berupa angka bulat.",
          },
          {
            status: 400,
          }
        );
      }

      input.stockLimit =
        value;
    }

    /**
     * --------------------------------------------------------
     * PER USER LIMIT
     * --------------------------------------------------------
     */

    if (
      perUserLimit !==
      undefined
    ) {
      const value =
        Number(
          perUserLimit
        );

      if (
        !Number.isInteger(
          value
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Per user limit harus berupa angka bulat.",
          },
          {
            status: 400,
          }
        );
      }

      input.perUserLimit =
        value;
    }

    /**
     * --------------------------------------------------------
     * SORT ORDER
     * --------------------------------------------------------
     */

    if (
      sortOrder !==
      undefined
    ) {
      const value =
        Number(
          sortOrder
        );

      if (
        !Number.isInteger(
          value
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Sort order harus berupa angka bulat.",
          },
          {
            status: 400,
          }
        );
      }

      input.sortOrder =
        value;
    }

    /**
     * --------------------------------------------------------
     * ACTIVE
     * --------------------------------------------------------
     */

    if (
      isActive !==
      undefined
    ) {
      if (
        typeof isActive !==
        "boolean"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Status aktif item tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      input.isActive =
        isActive;
    }

    /**
     * --------------------------------------------------------
     * UPDATE VIA SERVICE
     * --------------------------------------------------------
     */

    const item =
      await FlashSaleItemService.update(
        flashSaleId,
        itemId,
        input
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Item Flash Sale berhasil diperbarui.",
        data: item,
      },
      {
        status: 200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "[FLASH_SALE_ITEM_PATCH]",
      error
    );

    return getErrorResponse(
      error
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
    /**
     * --------------------------------------------------------
     * ADMIN AUTHORIZATION
     * --------------------------------------------------------
     */

    await requireAdmin();

    const {
      id: flashSaleId,
      itemId,
    } = await context.params;

    if (
      !flashSaleId?.trim() ||
      !itemId?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Flash Sale ID dan Item ID wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * DELETE VIA SERVICE
     * --------------------------------------------------------
     *
     * Service akan:
     *
     * 1. memastikan item milik campaign
     * 2. mengecek purchase history
     * 3. menolak hard delete jika sudah pernah dibeli
     * 4. melakukan delete jika aman
     */

    await FlashSaleItemService.delete(
      flashSaleId,
      itemId
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Item Flash Sale berhasil dihapus.",
      },
      {
        status: 200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "[FLASH_SALE_ITEM_DELETE]",
      error
    );

    return getErrorResponse(
      error
    );
  }
}