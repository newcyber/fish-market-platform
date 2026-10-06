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
    /**
     * --------------------------------------------------------
     * ADMIN AUTHORIZATION
     * --------------------------------------------------------
     *
     * Session disimpan karena actorId diperlukan oleh
     * FlashSaleItemService.create() untuk audit trail.
     */
    const session =
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

    /**
     * --------------------------------------------------------
     * BULK CREATE
     * --------------------------------------------------------
     *
     * Dipakai oleh SKU matrix admin. Backend tetap menjadi
     * sumber kebenaran untuk harga normal, stok, duplicate,
     * quota, dan limit customer melalui service.
     */
    if (Array.isArray(body.items)) {
      if (body.items.length === 0) {
        return NextResponse.json(
          { success: false, message: "Minimal satu SKU harus dipilih." },
          { status: 400 }
        );
      }

      if (body.items.length > 100) {
        return NextResponse.json(
          { success: false, message: "Maksimal 100 SKU dapat ditambahkan dalam satu bulk action." },
          { status: 400 }
        );
      }

      const items = body.items.map((item: unknown, index: number) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          throw new Error(`Data SKU ke-${index + 1} tidak valid.`);
        }

        const value = item as Record<string, unknown>;
        const productId = value.productId;
        const skuId = value.skuId;
        const flashPrice = value.flashPrice;
        const stockLimit = value.stockLimit;
        const perUserLimit = value.perUserLimit;
        const isActive = value.isActive;
        const sortOrder = value.sortOrder;

        if (typeof productId !== "string" || !productId.trim()) {
          throw new Error(`Product ID SKU ke-${index + 1} wajib diisi.`);
        }
        if (typeof skuId !== "string" || !skuId.trim()) {
          throw new Error(`SKU ID ke-${index + 1} wajib diisi.`);
        }
        if (typeof flashPrice !== "number" || !Number.isFinite(flashPrice)) {
          throw new Error(`Harga Flash Sale SKU ke-${index + 1} tidak valid.`);
        }
        if (typeof stockLimit !== "number" || !Number.isInteger(stockLimit)) {
          throw new Error(`Stock limit SKU ke-${index + 1} tidak valid.`);
        }
        if (perUserLimit !== undefined && (typeof perUserLimit !== "number" || !Number.isInteger(perUserLimit))) {
          throw new Error(`Per user limit SKU ke-${index + 1} tidak valid.`);
        }
        if (isActive !== undefined && typeof isActive !== "boolean") {
          throw new Error(`Status aktif SKU ke-${index + 1} tidak valid.`);
        }
        if (sortOrder !== undefined && (typeof sortOrder !== "number" || !Number.isInteger(sortOrder))) {
          throw new Error(`Sort order SKU ke-${index + 1} tidak valid.`);
        }

        return {
          productId: productId.trim(),
          skuId: skuId.trim(),
          flashPrice,
          stockLimit,
          perUserLimit,
          isActive: isActive ?? true,
          sortOrder: sortOrder ?? 0,
        };
      });

      const createdItems = await FlashSaleItemService.createMany(
        id,
        items,
        session.user.id
      );

      return NextResponse.json(
        {
          success: true,
          message: `${createdItems.length} SKU berhasil ditambahkan ke Flash Sale.`,
          data: createdItems,
        },
        { status: 201 }
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

          message:
            "SKU ID wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      originalPrice !== undefined &&
      (
        typeof originalPrice !== "number" ||
        !Number.isFinite(originalPrice)
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Harga normal harus berupa angka yang valid.",
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
     *
     * actorId diteruskan dari authenticated admin session
     * agar service dapat membuat audit log CREATE.
     */
    const item =
      await FlashSaleItemService.create(
        id,
        {
          productId,

          skuId:
            skuId.trim(),

          originalPrice,

          flashPrice,

          stockLimit,

          perUserLimit,

          isActive,

          sortOrder,
        },
        session.user.id
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