import {
  FlashSaleStatus,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import FlashSaleService from "@/services/flash-sale/flash-sale.service";

// Sesuaikan path ini dengan helper auth yang dipakai
// oleh API voucher kamu.
import { requireAdmin } from "@/lib/auth/admin";

/**
 * ============================================================
 * ADMIN FLASH SALE API
 * ============================================================
 *
 * GET
 * - List Flash Sale
 *
 * POST
 * - Create Flash Sale
 */

/**
 * ============================================================
 * GET - LIST FLASH SALES
 * ============================================================
 */

export async function GET(
  request: NextRequest
) {
  try {
    await requireAdmin();

    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    const pageParam =
      searchParams.get(
        "page"
      );

    const limitParam =
      searchParams.get(
        "limit"
      );

    const statusParam =
      searchParams.get(
        "status"
      );

    const search =
      searchParams.get(
        "search"
      ) ||
      undefined;

    const page =
      pageParam
        ? Number(pageParam)
        : 1;

    const limit =
      limitParam
        ? Number(limitParam)
        : 20;

    let status:
      | FlashSaleStatus
      | undefined;

    if (statusParam) {
      if (
        !Object.values(
          FlashSaleStatus
        ).includes(
          statusParam as FlashSaleStatus
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

      status =
        statusParam as FlashSaleStatus;
    }

    const result =
      await FlashSaleService.getMany({
        page,

        limit,

        status,

        search,
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Data Flash Sale berhasil diambil.",

        data:
          result.data,

        pagination:
          result.pagination,
      },
      {
        status: 200,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "[ADMIN_FLASH_SALES_GET]",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat mengambil Flash Sale.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * ============================================================
 * POST - CREATE FLASH SALE
 * ============================================================
 */

export async function POST(
  request: NextRequest
) {
  try {
    await requireAdmin();

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

    if (
      !name ||
      typeof name !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Nama Flash Sale wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !startAt
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Tanggal mulai wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !endAt
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Tanggal selesai wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

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

    const flashSale =
      await FlashSaleService.create({
        name,

        slug:
          typeof slug === "string"
            ? slug
            : undefined,

        description:
          typeof description === "string"
            ? description
            : null,

        banner:
          typeof banner === "string"
            ? banner
            : null,

        status:
          validatedStatus,

        startAt,

        endAt,

        sortOrder:
          typeof sortOrder === "number"
            ? sortOrder
            : undefined,
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Flash Sale berhasil dibuat.",

        data:
          flashSale,
      },
      {
        status: 201,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "[ADMIN_FLASH_SALES_POST]",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat membuat Flash Sale.";

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
}