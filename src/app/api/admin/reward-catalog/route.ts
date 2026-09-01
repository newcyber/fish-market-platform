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
 *
 * GET
 * - Mengambil seluruh reward catalog.
 *
 * POST
 * - Membuat reward baru.
 *
 * Image upload TIDAK dilakukan di endpoint ini.
 *
 * Image sudah diupload melalui:
 *
 * POST /api/admin/reward-catalog/upload
 *
 * Endpoint ini hanya menerima URL image yang sudah
 * dikembalikan oleh endpoint upload.
 *
 * ============================================================
 */

type CreateRewardRequestBody = {
  name?: unknown;

  description?: unknown;

  image?: unknown;

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
 * GET /api/admin/reward-catalog
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
 * POST /api/admin/reward-catalog
 * ============================================================
 *
 * CREATE REWARD
 *
 * Content-Type:
 *
 * application/json
 *
 * Image dikirim sebagai URL/path hasil dari:
 *
 * POST /api/admin/reward-catalog/upload
 *
 * ============================================================
 */

export async function POST(
  request: Request
) {
  try {
    await requireAdmin();

    /**
     * ========================================================
     * PARSE JSON
     * ========================================================
     */

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
      typeof body !== "object"
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
     * IMAGE
     * ========================================================
     *
     * Image harus berupa string URL/path.
     *
     * Upload file dilakukan melalui endpoint upload
     * terpisah.
     */

    let image:
      | string
      | null
      | undefined;

    if (
      body.image === undefined
    ) {
      image = undefined;
    } else if (
      body.image === null
    ) {
      image = null;
    } else if (
      typeof body.image === "string"
    ) {
      image =
        body.image.trim() || null;
    } else {
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
     * BASIC TYPE VALIDATION
     * ========================================================
     *
     * Business validation tetap dilakukan oleh service.
     *
     * Route hanya memastikan payload memiliki tipe
     * yang masuk akal.
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
            : typeof body.description ===
                "string"
              ? body.description
              : undefined,

        image,

        requiredPoints:
          body.requiredPoints as
            number,

        stock:
          body.stock === undefined
            ? 0
            : (body.stock as number),

        isActive:
          body.isActive === undefined
            ? true
            : (body.isActive as boolean),

        sortOrder:
          body.sortOrder === undefined
            ? 0
            : (body.sortOrder as number),
      });

    /**
     * ========================================================
     * SUCCESS
     * ========================================================
     */

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
