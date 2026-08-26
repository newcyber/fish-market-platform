import {
  NextRequest,
  NextResponse,
} from "next/server";

import { requireAdmin } from "@/lib/auth/admin";

import FlashSaleItemService from "@/services/flash-sale/flash-sale-item.service";

/**
 * ============================================================
 * ADMIN FLASH SALE ITEMS API
 * ============================================================
 *
 * GET
 *   Mengambil seluruh item dalam Flash Sale.
 *
 * POST
 *   Menambahkan item baru ke Flash Sale.
 */

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
      : "Terjadi kesalahan pada Flash Sale.";

  const notFoundMessages = [
    "Flash Sale tidak ditemukan.",
    "Produk tidak ditemukan.",
    "Weight option tidak ditemukan atau tidak milik produk tersebut.",
  ];

  if (
    notFoundMessages.includes(
      message
    )
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
 * GET
 * ============================================================
 *
 * GET /api/admin/flash-sales/[id]/items
 */

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    await requireAdmin();

    const {
      id,
    } =
      await context.params;

    const items =
      await FlashSaleItemService.getMany(
        id
      );

    return NextResponse.json(
      {
        success: true,

        message:
          "Item Flash Sale berhasil diambil.",

        data: items,
      },
      {
        status: 200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "[ADMIN_FLASH_SALE_ITEMS_GET]",
      error
    );

    return getErrorResponse(
      error
    );
  }
}

/**
 * ============================================================
 * POST
 * ============================================================
 *
 * POST /api/admin/flash-sales/[id]/items
 *
 * Body:
 *
 * {
 *   "productId": "...",
 *   "skuId": "...",
 *   "originalPrice": 50000,
 *   "flashPrice": 40000,
 *   "stockLimit": 100,
 *   "perUserLimit": 2,
 *   "isActive": true,
 *   "sortOrder": 0
 * }
 */

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    await requireAdmin();

    const {
      id,
    } =
      await context.params;

    const body =
      await request.json();

    if (
      !body ||
      typeof body !== "object" ||
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
  isActive,
  sortOrder,
} = body;

    /**
     * --------------------------------------------------------
     * BASIC TYPE VALIDATION
     * --------------------------------------------------------
     */

    if (
      typeof productId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Product ID wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    if (
  typeof skuId !== "string" ||
  !skuId.trim()
) {
  return NextResponse.json(
    {
      success: false,
      message: "SKU ID wajib diisi.",
    },
    {
      status: 400,
    }
  );
}

    if (
      typeof originalPrice !== "number"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Harga normal harus berupa angka.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof flashPrice !== "number"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Harga Flash Sale harus berupa angka.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof stockLimit !== "number"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Stock limit harus berupa angka.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      perUserLimit !== undefined &&
      typeof perUserLimit !== "number"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Per user limit harus berupa angka.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      isActive !== undefined &&
      typeof isActive !== "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Status aktif tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      sortOrder !== undefined &&
      typeof sortOrder !== "number"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Sort order harus berupa angka.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * CREATE FLASH SALE ITEM
     * --------------------------------------------------------
     */

    const item =
  await FlashSaleItemService.create(
    id,
    {
      productId,

      skuId: skuId.trim(),

      originalPrice,

      flashPrice,

      stockLimit,

      perUserLimit,

      isActive,

      sortOrder,
    }
  );

    return NextResponse.json(
      {
        success: true,

        message:
          "Item berhasil ditambahkan ke Flash Sale.",

        data: item,
      },
      {
        status: 201,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "[ADMIN_FLASH_SALE_ITEMS_POST]",
      error
    );

    return getErrorResponse(
      error
    );
  }
}