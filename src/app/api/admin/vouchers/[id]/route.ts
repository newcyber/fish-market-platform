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
  type UpdateAdminVoucherInput,
} from "@/services/voucher/admin-voucher.service";

/**
 * ============================================================
 * ADMIN VOUCHER DETAIL API
 * ============================================================
 *
 * GET    /api/admin/vouchers/:id
 * PATCH  /api/admin/vouchers/:id
 * DELETE /api/admin/vouchers/:id
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

  if (
    !Number.isFinite(parsed)
  ) {
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

  if (
    !Number.isInteger(parsed)
  ) {
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

  if (
    typeof value !== "string"
  ) {
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

function getErrorResponse(
  error: unknown
) {
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

  if (
    error instanceof Error &&
    error.message ===
      "Voucher tidak ditemukan."
  ) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 404,
      }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 400,
      }
    );
  }

  return NextResponse.json(
    {
      success: false,
      message:
        "Terjadi kesalahan internal.",
    },
    {
      status: 500,
    }
  );
}

/**
 * ============================================================
 * GET
 * ============================================================
 *
 * GET /api/admin/vouchers/:id
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
    } = await context.params;

    const voucher =
      await AdminVoucherService.getById(
        id
      );

    return NextResponse.json({
      success: true,
      message:
        "Detail voucher berhasil diambil.",
      data: voucher,
    });
  } catch (error) {
    console.error(
      "[ADMIN_VOUCHER_DETAIL_GET_ERROR]",
      error
    );

    return getErrorResponse(error);
  }
}

/**
 * ============================================================
 * PATCH
 * ============================================================
 *
 * PATCH /api/admin/vouchers/:id
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
    } = await context.params;

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

    const input:
      UpdateAdminVoucherInput = {};

    /**
     * ----------------------------------------------------------
     * CODE
     * ----------------------------------------------------------
     */

    if (
      data.code !== undefined
    ) {
      if (
        typeof data.code !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Kode voucher tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      input.code =
        data.code.trim();
    }

    /**
     * ----------------------------------------------------------
     * NAME
     * ----------------------------------------------------------
     */

    if (
      data.name !== undefined
    ) {
      if (
        typeof data.name !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Nama voucher tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      input.name =
        data.name.trim();
    }

    /**
     * ----------------------------------------------------------
     * DESCRIPTION
     * ----------------------------------------------------------
     */

    if (
      data.description !== undefined
    ) {
      if (
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

      input.description =
        data.description;
    }

    /**
     * ----------------------------------------------------------
     * DISCOUNT TYPE
     * ----------------------------------------------------------
     */

    if (
      data.discountType !== undefined
    ) {
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

      input.discountType =
        data.discountType;
    }

    /**
     * ----------------------------------------------------------
     * DISCOUNT VALUE
     * ----------------------------------------------------------
     */

    if (
      data.discountValue !== undefined
    ) {
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
              "Nilai diskon tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      input.discountValue =
        discountValue;
    }

    /**
     * ----------------------------------------------------------
     * MINIMUM PURCHASE
     * ----------------------------------------------------------
     */

    if (
      data.minimumPurchase !== undefined
    ) {
      const minimumPurchase =
        parseNullableNumber(
          data.minimumPurchase
        );

      if (
        minimumPurchase === undefined
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Minimum pembelian tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      input.minimumPurchase =
        minimumPurchase;
    }

    /**
     * ----------------------------------------------------------
     * MAXIMUM DISCOUNT
     * ----------------------------------------------------------
     */

    if (
      data.maximumDiscount !== undefined
    ) {
      const maximumDiscount =
        parseNullableNumber(
          data.maximumDiscount
        );

      if (
        maximumDiscount === undefined
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Maksimum diskon tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      input.maximumDiscount =
        maximumDiscount;
    }

    /**
     * ----------------------------------------------------------
     * USAGE LIMIT
     * ----------------------------------------------------------
     */

    if (
      data.usageLimit !== undefined
    ) {
      const usageLimit =
        parseNullableInteger(
          data.usageLimit
        );

      if (
        usageLimit === undefined
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Batas penggunaan tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      input.usageLimit =
        usageLimit;
    }

    /**
     * ----------------------------------------------------------
     * PER USER LIMIT
     * ----------------------------------------------------------
     */

    if (
      data.perUserLimit !== undefined
    ) {
      const perUserLimit =
        parseNullableInteger(
          data.perUserLimit
        );

      if (
        perUserLimit === undefined
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Batas penggunaan per pengguna tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      input.perUserLimit =
        perUserLimit;
    }

    /**
     * ----------------------------------------------------------
     * START DATE
     * ----------------------------------------------------------
     */

    if (
      data.startAt !== undefined
    ) {
      const startAt =
        parseNullableDate(
          data.startAt
        );

      if (
        startAt === undefined
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Tanggal mulai tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      input.startAt =
        startAt;
    }

    /**
     * ----------------------------------------------------------
     * END DATE
     * ----------------------------------------------------------
     */

    if (
      data.endAt !== undefined
    ) {
      const endAt =
        parseNullableDate(
          data.endAt
        );

      if (
        endAt === undefined
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Tanggal berakhir tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      input.endAt =
        endAt;
    }

    /**
     * ----------------------------------------------------------
     * ACTIVE STATUS
     * ----------------------------------------------------------
     */

    if (
      data.isActive !== undefined
    ) {
      if (
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

      input.isActive =
        data.isActive;
    }

    /**
     * ----------------------------------------------------------
     * EMPTY UPDATE CHECK
     * ----------------------------------------------------------
     */

    if (
      Object.keys(input).length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tidak ada data yang diperbarui.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ----------------------------------------------------------
     * UPDATE
     * ----------------------------------------------------------
     */

    const voucher =
      await AdminVoucherService.update(
        id,
        input
      );

    return NextResponse.json({
      success: true,
      message:
        "Voucher berhasil diperbarui.",
      data: voucher,
    });
  } catch (error) {
    console.error(
      "[ADMIN_VOUCHER_DETAIL_PATCH_ERROR]",
      error
    );

    return getErrorResponse(error);
  }
}

/**
 * ============================================================
 * DELETE
 * ============================================================
 *
 * DELETE /api/admin/vouchers/:id
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
    } = await context.params;

    await AdminVoucherService.delete(
      id
    );

    return NextResponse.json({
      success: true,
      message:
        "Voucher berhasil dihapus.",
    });
  } catch (error) {
    console.error(
      "[ADMIN_VOUCHER_DETAIL_DELETE_ERROR]",
      error
    );

    return getErrorResponse(error);
  }
}