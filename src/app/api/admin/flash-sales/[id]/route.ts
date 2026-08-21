import {
  FlashSaleStatus,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { requireAdmin } from "@/lib/auth/admin";

import FlashSaleService from "@/services/flash-sale/flash-sale.service";

/**
 * ============================================================
 * ADMIN FLASH SALE DETAIL API
 * ============================================================
 *
 * GET
 *    Mengambil detail Flash Sale
 *
 * PATCH
 *    Update Flash Sale
 *
 * DELETE
 *    Soft delete Flash Sale
 */

/**
 * ============================================================
 * GET ERROR RESPONSE
 * ============================================================
 */

function getErrorResponse(
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : "Terjadi kesalahan pada Flash Sale.";

  if (
    message ===
    "Flash Sale tidak ditemukan."
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

    const flashSale =
      await FlashSaleService.getById(
        id
      );

    return NextResponse.json(
      {
        success: true,

        message:
          "Detail Flash Sale berhasil diambil.",

        data:
          flashSale,
      },
      {
        status: 200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "[ADMIN_FLASH_SALE_GET]",
      error
    );

    return getErrorResponse(
      error
    );
  }
}

/**
 * ============================================================
 * PATCH
 * ============================================================
 */

export async function PATCH(
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
      typeof body !== "object"
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
      name,
      slug,
      description,
      banner,
      status,
      startAt,
      endAt,
      sortOrder,
    } =
      body;

    /**
     * --------------------------------------------------------
     * VALIDATE STATUS
     * --------------------------------------------------------
     */

    let validatedStatus:
      | FlashSaleStatus
      | undefined;

    if (
      status !== undefined &&
      status !== null
    ) {
      if (
        !Object.values(
          FlashSaleStatus
        ).includes(
          status as FlashSaleStatus
        )
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Status Flash Sale tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      validatedStatus =
        status as FlashSaleStatus;
    }

    /**
     * --------------------------------------------------------
     * VALIDATE SORT ORDER
     * --------------------------------------------------------
     */

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
     * UPDATE
     * --------------------------------------------------------
     */

    const flashSale =
      await FlashSaleService.update(
        id,
        {
          name:
            typeof name === "string"
              ? name
              : undefined,

          slug:
            typeof slug === "string"
              ? slug
              : undefined,

          description:
            description === null ||
            typeof description === "string"
              ? description
              : undefined,

          banner:
            banner === null ||
            typeof banner === "string"
              ? banner
              : undefined,

          status:
            validatedStatus,

          startAt:
            startAt !== undefined
              ? startAt
              : undefined,

          endAt:
            endAt !== undefined
              ? endAt
              : undefined,

          sortOrder:
            typeof sortOrder === "number"
              ? sortOrder
              : undefined,
        }
      );

    return NextResponse.json(
      {
        success: true,

        message:
          "Flash Sale berhasil diperbarui.",

        data:
          flashSale,
      },
      {
        status: 200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "[ADMIN_FLASH_SALE_PATCH]",
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
 * ============================================================
 */

export async function DELETE(
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

    await FlashSaleService.delete(
      id
    );

    return NextResponse.json(
      {
        success: true,

        message:
          "Flash Sale berhasil dihapus.",
      },
      {
        status: 200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "[ADMIN_FLASH_SALE_DELETE]",
      error
    );

    return getErrorResponse(
      error
    );
  }
}