import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  VoucherDiscountType,
} from "@prisma/client";

import { requireAdmin } from "@/lib/auth/admin";

import {
  AdminVoucherService,
  type CreateAdminVoucherInput,
} from "@/services/voucher/admin-voucher.service";

/**
 * ============================================================
 * ADMIN VOUCHERS API
 * ============================================================
 *
 * GET  /api/admin/vouchers
 * POST /api/admin/vouchers
 *
 * GET:
 * - Pagination
 * - Search
 * - Filter status aktif
 * - Filter tipe diskon
 *
 * POST:
 * - Membuat voucher baru
 *
 * Hanya dapat diakses oleh:
 * - ADMIN
 * - SUPER_ADMIN
 */

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function parseBoolean(
  value: string | null
): boolean | undefined {
  if (value === null) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function parsePositiveInteger(
  value: string | null,
  fallback: number
): number {
  if (!value) {
    return fallback;
  }

  const parsed =
    Number.parseInt(value, 10);

  if (
    Number.isNaN(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
}

function parseNullableNumber(
  value: unknown
): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    value === null ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    typeof value === "number"
      ? value
      : Number(value);

  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return parsed;
}

function parseNullableInteger(
  value: unknown
): number | null | undefined {
  const parsed =
    parseNullableNumber(value);

  if (
    parsed === null ||
    parsed === undefined
  ) {
    return parsed;
  }

  if (!Number.isInteger(parsed)) {
    return undefined;
  }

  return parsed;
}

function parseNullableDate(
  value: unknown
): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return undefined;
  }

  return date;
}

function isVoucherDiscountType(
  value: unknown
): value is VoucherDiscountType {
  return (
    value ===
      VoucherDiscountType.PERCENTAGE ||
    value ===
      VoucherDiscountType.FIXED_AMOUNT
  );
}

/**
 * ============================================================
 * GET
 * ============================================================
 *
 * GET /api/admin/vouchers
 *
 * Query:
 *
 * ?page=1
 * ?limit=20
 * ?search=HEMAT
 * ?isActive=true
 * ?discountType=PERCENTAGE
 */

export async function GET(
  request: NextRequest
) {
  try {
    /**
     * ----------------------------------------------------------
     * AUTHORIZATION
     * ----------------------------------------------------------
     */

    await requireAdmin();

    /**
     * ----------------------------------------------------------
     * QUERY PARAMS
     * ----------------------------------------------------------
     */

    const {
      searchParams,
    } = new URL(
      request.url
    );

    const search =
      searchParams
        .get("search")
        ?.trim() ||
      undefined;

    const page =
      parsePositiveInteger(
        searchParams.get("page"),
        1
      );

    const limit =
      parsePositiveInteger(
        searchParams.get("limit"),
        20
      );

    const isActive =
      parseBoolean(
        searchParams.get(
          "isActive"
        )
      );

    const discountTypeParam =
      searchParams.get(
        "discountType"
      );

    let discountType:
      | VoucherDiscountType
      | undefined;

    if (
      discountTypeParam !== null
    ) {
      if (
        !isVoucherDiscountType(
          discountTypeParam
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Tipe diskon tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      discountType =
        discountTypeParam;
    }

    /**
     * ----------------------------------------------------------
     * GET VOUCHERS
     * ----------------------------------------------------------
     */

    const result =
      await AdminVoucherService.getList({
        search,
        page,
        limit,
        isActive,
        discountType,
      });

    /**
     * ----------------------------------------------------------
     * SUCCESS
     * ----------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      message:
        "Data voucher berhasil diambil.",

      ...result,
    });
  } catch (error) {
    /**
     * ----------------------------------------------------------
     * UNAUTHORIZED
     * ----------------------------------------------------------
     */

    if (
      error instanceof Error &&
      error.message ===
        "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda harus login terlebih dahulu.",
        },
        {
          status: 401,
        }
      );
    }

    /**
     * ----------------------------------------------------------
     * FORBIDDEN
     * ----------------------------------------------------------
     */

    if (
      error instanceof Error &&
      error.message ===
        "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda tidak memiliki akses ke halaman admin.",
        },
        {
          status: 403,
        }
      );
    }

    console.error(
      "[ADMIN_VOUCHERS_GET_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat mengambil data voucher.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * ============================================================
 * POST
 * ============================================================
 *
 * POST /api/admin/vouchers
 *
 * Body:
 *
 * {
 *   "code": "HEMAT10",
 *   "name": "Diskon 10%",
 *   "description": "...",
 *   "discountType": "PERCENTAGE",
 *   "discountValue": 10,
 *   "minimumPurchase": 50000,
 *   "maximumDiscount": 10000,
 *   "usageLimit": 100,
 *   "perUserLimit": 1,
 *   "startAt": "2026-08-20T00:00:00.000Z",
 *   "endAt": "2026-08-31T23:59:59.000Z",
 *   "isActive": true
 * }
 */

export async function POST(
  request: NextRequest
) {
  try {
    /**
     * ----------------------------------------------------------
     * AUTHORIZATION
     * ----------------------------------------------------------
     */

    await requireAdmin();

    /**
     * ----------------------------------------------------------
     * PARSE JSON
     * ----------------------------------------------------------
     */

    let body: unknown;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Format JSON tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ----------------------------------------------------------
     * VALIDATE BODY TYPE
     * ----------------------------------------------------------
     */

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Data request tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    const data =
      body as Record<
        string,
        unknown
      >;

    /**
     * ----------------------------------------------------------
     * REQUIRED FIELDS
     * ----------------------------------------------------------
     */

    if (
      typeof data.code !== "string" ||
      !data.code.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kode voucher wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof data.name !== "string" ||
      !data.name.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Nama voucher wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isVoucherDiscountType(
        data.discountType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tipe diskon tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ----------------------------------------------------------
     * NUMERIC FIELDS
     * ----------------------------------------------------------
     */

    const discountValue =
      parseNullableNumber(
        data.discountValue
      );

    if (
      discountValue === undefined ||
      discountValue === null
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Nilai diskon wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    const minimumPurchase =
      parseNullableNumber(
        data.minimumPurchase
      );

    const maximumDiscount =
      parseNullableNumber(
        data.maximumDiscount
      );

    const usageLimit =
      parseNullableInteger(
        data.usageLimit
      );

    const perUserLimit =
      parseNullableInteger(
        data.perUserLimit
      );

    if (
      minimumPurchase === undefined ||
      maximumDiscount === undefined ||
      usageLimit === undefined ||
      perUserLimit === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Terdapat nilai numerik yang tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ----------------------------------------------------------
     * DATE FIELDS
     * ----------------------------------------------------------
     */

    const startAt =
      parseNullableDate(
        data.startAt
      );

    const endAt =
      parseNullableDate(
        data.endAt
      );

    if (
      startAt === undefined ||
      endAt === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Format tanggal voucher tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ----------------------------------------------------------
     * BOOLEAN FIELD
     * ----------------------------------------------------------
     */

    if (
      data.isActive !== undefined &&
      typeof data.isActive !==
        "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Status voucher tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ----------------------------------------------------------
     * DESCRIPTION
     * ----------------------------------------------------------
     */

    if (
      data.description !== undefined &&
      data.description !== null &&
      typeof data.description !==
        "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Deskripsi voucher tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ----------------------------------------------------------
     * BUILD INPUT
     * ----------------------------------------------------------
     */

    const input: CreateAdminVoucherInput = {
      code:
        data.code.trim(),

      name:
        data.name.trim(),

      description:
        data.description === undefined
          ? undefined
          : data.description === null
            ? null
            : data.description,

      discountType:
        data.discountType,

      discountValue,

      minimumPurchase,

      maximumDiscount,

      usageLimit,

      perUserLimit,

      startAt,

      endAt,

      isActive:
        data.isActive === undefined
          ? undefined
          : data.isActive,
    };

    /**
     * ----------------------------------------------------------
     * CREATE VOUCHER
     * ----------------------------------------------------------
     */

    const voucher =
      await AdminVoucherService.create(
        input
      );

    /**
     * ----------------------------------------------------------
     * SUCCESS
     * ----------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Voucher berhasil dibuat.",

        data: voucher,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    /**
     * ----------------------------------------------------------
     * AUTHORIZATION ERRORS
     * ----------------------------------------------------------
     */

    if (
      error instanceof Error &&
      error.message ===
        "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda harus login terlebih dahulu.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda tidak memiliki akses ke halaman admin.",
        },
        {
          status: 403,
        }
      );
    }

    /**
     * ----------------------------------------------------------
     * BUSINESS / VALIDATION ERROR
     * ----------------------------------------------------------
     */

    if (
      error instanceof Error
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            error.message,
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ----------------------------------------------------------
     * INTERNAL ERROR
     * ----------------------------------------------------------
     */

    console.error(
      "[ADMIN_VOUCHERS_POST_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat membuat voucher.",
      },
      {
        status: 500,
      }
    );
  }
}