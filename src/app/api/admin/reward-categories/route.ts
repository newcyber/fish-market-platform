import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/auth/admin";

import {
  AdminRewardCategoryService,
} from "@/services/reward/admin-reward-category.service";

/**
 * ============================================================
 * ADMIN REWARD CATEGORY API
 * ============================================================
 *
 * GET
 *
 * Tanpa query:
 *
 * GET /api/admin/reward-categories
 *
 * Mengambil seluruh category untuk halaman Admin.
 *
 * Dengan:
 *
 * GET /api/admin/reward-categories?currentId=xxx
 *
 * Mengambil category yang dapat digunakan oleh
 * Reward Catalog Form:
 *
 * - seluruh category aktif
 * - category inactive yang sedang digunakan reward
 *
 * POST
 *
 * Membuat reward category baru.
 *
 * ============================================================
 */

/**
 * ============================================================
 * PARSE OPTIONAL STRING
 * ============================================================
 */

function parseOptionalString(
  value: unknown
): string | undefined {
  if (
    value === null ||
    value === undefined
  ) {
    return undefined;
  }

  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  return normalized || undefined;
}

/**
 * ============================================================
 * PARSE OPTIONAL NUMBER
 * ============================================================
 */

function parseOptionalNumber(
  value: unknown
): number | undefined {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return undefined;
  }

  if (
    typeof value === "number"
  ) {
    return Number.isFinite(
      value
    )
      ? value
      : undefined;
  }

  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  if (!normalized) {
    return undefined;
  }

  const numberValue =
    Number(
      normalized
    );

  return Number.isFinite(
    numberValue
  )
    ? numberValue
    : undefined;
}

/**
 * ============================================================
 * PARSE OPTIONAL BOOLEAN
 * ============================================================
 */

function parseOptionalBoolean(
  value: unknown
): boolean | undefined {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined;
  }

  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim().toLowerCase();

  if (
    normalized === "true"
  ) {
    return true;
  }

  if (
    normalized === "false"
  ) {
    return false;
  }

  return undefined;
}

/**
 * ============================================================
 * GET /api/admin/reward-categories
 * ============================================================
 *
 * Default:
 *
 * Mengambil seluruh category.
 *
 * Query:
 *
 * ?currentId=<categoryId>
 *
 * Digunakan RewardCatalogForm ketika EDIT.
 *
 * Hasil:
 *
 * - category aktif
 * - category inactive yang sedang digunakan reward
 *
 * ============================================================
 */

export async function GET(
  request: Request
) {
  try {
    /**
     * --------------------------------------------------------
     * AUTHORIZATION
     * --------------------------------------------------------
     */

    await requireAdmin();

    /**
     * --------------------------------------------------------
     * QUERY PARAMS
     * --------------------------------------------------------
     */

    const url =
      new URL(
        request.url
      );

    const currentId =
      parseOptionalString(
        url.searchParams.get(
          "currentId"
        )
      );

    /**
     * --------------------------------------------------------
     * GET DATA
     * --------------------------------------------------------
     */

    const categories =
      currentId
        ? await AdminRewardCategoryService.getForRewardCatalog(
            currentId
          )
        : await AdminRewardCategoryService.getAll();

    /**
     * --------------------------------------------------------
     * SUCCESS
     * --------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      data:
        categories,
    });
  } catch (error) {
    console.error(
      "[ADMIN_REWARD_CATEGORY_GET]",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Gagal mengambil reward category.";

    /**
     * --------------------------------------------------------
     * AUTH ERROR
     * --------------------------------------------------------
     */

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

    /**
     * --------------------------------------------------------
     * NOT FOUND
     * --------------------------------------------------------
     */

    if (
      message ===
      "Reward category tidak ditemukan."
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
     * --------------------------------------------------------
     * SERVER ERROR
     * --------------------------------------------------------
     */

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
 * POST /api/admin/reward-categories
 * ============================================================
 *
 * CREATE CATEGORY
 *
 * Request:
 *
 * {
 *   "name": "Kebutuhan Rumah",
 *   "slug": "kebutuhan-rumah",
 *   "isActive": true,
 *   "sortOrder": 1
 * }
 *
 * Slug optional.
 *
 * Jika slug tidak dikirim, service akan membuat slug
 * berdasarkan nama category.
 *
 * ============================================================
 */

export async function POST(
  request: Request
) {
  try {
    /**
     * --------------------------------------------------------
     * AUTHORIZATION
     * --------------------------------------------------------
     */

    await requireAdmin();

    /**
     * --------------------------------------------------------
     * PARSE JSON
     * --------------------------------------------------------
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
            "Format request tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * ENSURE OBJECT
     * --------------------------------------------------------
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
            "Data reward category tidak valid.",
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
     * --------------------------------------------------------
     * BASIC FIELDS
     * --------------------------------------------------------
     */

    const name =
      parseOptionalString(
        data.name
      );

    const slug =
      parseOptionalString(
        data.slug
      );

    const sortOrder =
      parseOptionalNumber(
        data.sortOrder
      );

    const isActive =
      parseOptionalBoolean(
        data.isActive
      );

    /**
     * --------------------------------------------------------
     * TYPE VALIDATION
     * --------------------------------------------------------
     */

    if (
      data.name !== undefined &&
      typeof data.name !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Nama kategori tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      data.slug !== undefined &&
      data.slug !== null &&
      typeof data.slug !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Slug kategori tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      data.sortOrder !== undefined &&
      data.sortOrder !== null &&
      data.sortOrder !== "" &&
      sortOrder === undefined
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

    if (
      data.isActive !== undefined &&
      data.isActive !== null &&
      isActive === undefined
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
     * --------------------------------------------------------
     * CREATE
     * --------------------------------------------------------
     */

    const category =
      await AdminRewardCategoryService.create({
        name:
          name ?? "",

        slug:
          slug ?? "",

        ...(sortOrder !== undefined && {
          sortOrder,
        }),

        ...(isActive !== undefined && {
          isActive,
        }),
      });

    /**
     * --------------------------------------------------------
     * SUCCESS
     * --------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        data:
          category,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[ADMIN_REWARD_CATEGORY_CREATE]",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Gagal membuat reward category.";

    /**
     * --------------------------------------------------------
     * AUTH ERROR
     * --------------------------------------------------------
     */

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

    /**
     * --------------------------------------------------------
     * DUPLICATE SLUG
     * --------------------------------------------------------
     */

    if (
      message ===
      "Slug reward category sudah digunakan."
    ) {
      return NextResponse.json(
        {
          success: false,

          message,
        },
        {
          status: 409,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * VALIDATION ERROR
     * --------------------------------------------------------
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
}
