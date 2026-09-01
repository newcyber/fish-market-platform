import { NextResponse } from "next/server";

import {
  requireAdmin,
} from "@/lib/auth/admin";

import {
  AdminRewardCatalogService,
} from "@/services/reward/admin-reward-catalog.service";

/**
 * ============================================================
 * ADMIN REWARD CATALOG API
 * ============================================================
 */

type CreateRewardRequestBody = {
  name?: unknown;

  description?: unknown;

  image?: unknown;

  categoryId?: unknown;

  requiredPoints?: unknown;

  stock?: unknown;

  isActive?: unknown;

  sortOrder?: unknown;
};

/**
 * ============================================================
 * AUTH ERROR RESPONSE
 * ============================================================
 */

function authErrorResponse(
  error: unknown,
  fallbackMessage: string
) {
  const message =
    error instanceof Error
      ? error.message
      : fallbackMessage;

  if (
    message ===
    "UNAUTHORIZED"
  ) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Anda harus login.",
      },
      {
        status: 401,
      }
    );
  }

  if (
    message ===
    "FORBIDDEN"
  ) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Anda tidak memiliki akses.",
      },
      {
        status: 403,
      }
    );
  }

  return null;
}

/**
 * ============================================================
 * GET
 * ============================================================
 */

export async function GET() {
  try {
    await requireAdmin();

    const rewards =
      await AdminRewardCatalogService.getAll();

    return NextResponse.json({
      success: true,

      data: rewards,
    });
  } catch (error) {
    console.error(
      "[ADMIN_REWARD_CATALOG_GET]",
      error
    );

    const authResponse =
      authErrorResponse(
        error,
        "Gagal mengambil reward catalog."
      );

    if (authResponse) {
      return authResponse;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Gagal mengambil reward catalog.";

    return NextResponse.json(
      {
        success: false,
        message,
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
 */

export async function POST(
  request: Request
) {
  try {
    await requireAdmin();

    let body:
      | CreateRewardRequestBody
      | null = null;

    try {
      body =
        (await request.json()) as
          CreateRewardRequestBody;
    } catch {
      return NextResponse.json(
        {
          success: false,

          message:
            "Format request tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Data reward tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ========================================================
     * NAME
     * ========================================================
     */

    if (
      body.name !== undefined &&
      typeof body.name !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Nama reward tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ========================================================
     * DESCRIPTION
     * ========================================================
     */

    if (
      body.description !== undefined &&
      body.description !== null &&
      typeof body.description !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Deskripsi reward tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ========================================================
     * IMAGE
     * ========================================================
     */

    if (
      body.image !== undefined &&
      body.image !== null &&
      typeof body.image !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Format gambar reward tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ========================================================
     * CATEGORY
     * ========================================================
     *
     * Category wajib dipilih.
     */

    if (
      typeof body.categoryId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Kategori reward wajib dipilih.",
        },
        {
          status: 400,
        }
      );
    }

    const categoryId =
      body.categoryId.trim();

    if (!categoryId) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Kategori reward wajib dipilih.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ========================================================
     * REQUIRED POINTS
     * ========================================================
     */

    if (
      typeof body.requiredPoints !==
        "number" ||
      !Number.isInteger(
        body.requiredPoints
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Required points tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ========================================================
     * STOCK
     * ========================================================
     */

    if (
      body.stock !== undefined &&
      (
        typeof body.stock !== "number" ||
        !Number.isInteger(
          body.stock
        )
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Stock tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ========================================================
     * ACTIVE STATUS
     * ========================================================
     */

    if (
      body.isActive !== undefined &&
      typeof body.isActive !== "boolean"
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

    /**
     * ========================================================
     * SORT ORDER
     * ========================================================
     */

    if (
      body.sortOrder !== undefined &&
      (
        typeof body.sortOrder !== "number" ||
        !Number.isInteger(
          body.sortOrder
        )
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Sort order tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * ========================================================
     * CREATE
     * ========================================================
     */

    const reward =
      await AdminRewardCatalogService.create({
        name:
          typeof body.name === "string"
            ? body.name
            : "",

        description:
          body.description === null
            ? null
            : typeof body.description === "string"
              ? body.description
              : undefined,

        image:
          body.image === null
            ? null
            : typeof body.image === "string"
              ? body.image.trim() || null
              : undefined,

        categoryId,

        requiredPoints:
          body.requiredPoints,

        stock:
          body.stock === undefined
            ? 0
            : body.stock,

        isActive:
          body.isActive === undefined
            ? true
            : body.isActive,

        sortOrder:
          body.sortOrder === undefined
            ? 0
            : body.sortOrder,
      });

    return NextResponse.json(
      {
        success: true,

        data: reward,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[ADMIN_REWARD_CATALOG_CREATE]",
      error
    );

    const authResponse =
      authErrorResponse(
        error,
        "Gagal membuat reward catalog."
      );

    if (authResponse) {
      return authResponse;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Gagal membuat reward catalog.";

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
