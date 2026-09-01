import { NextResponse } from "next/server";

import {
  requireAdmin,
} from "@/lib/auth/admin";

import {
  AdminRewardCategoryService,
} from "@/services/reward/admin-reward-category.service";

/**
 * ============================================================
 * ADMIN REWARD CATEGORY DETAIL API
 * ============================================================
 *
 * GET
 * - Mengambil satu reward category berdasarkan ID.
 *
 * PATCH
 * - Memperbarui reward category.
 *
 * Category TIDAK menyediakan DELETE.
 *
 * Jika category tidak ingin digunakan lagi,
 * gunakan isActive = false.
 *
 * ============================================================
 */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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
    return value;
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
    Number(normalized);

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
 * GET /api/admin/reward-categories/[id]
 * ============================================================
 */

export async function GET(
  _request: Request,
  context: RouteContext
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
     * GET PARAMETER
     * --------------------------------------------------------
     */

    const {
      id,
    } = await context.params;

    /**
     * --------------------------------------------------------
     * GET CATEGORY
     * --------------------------------------------------------
     */

    const category =
      await AdminRewardCategoryService.getById(
        id
      );

    /**
     * --------------------------------------------------------
     * GET REWARD COUNT
     * --------------------------------------------------------
     *
     * Informasi tambahan untuk Admin.
     */

    const rewardCount =
      await AdminRewardCategoryService.getRewardCount(
        id
      );

    /**
     * --------------------------------------------------------
     * SUCCESS
     * --------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      data: {
        ...category,

        rewardCount,
      },
    });
  } catch (error) {
    console.error(
      "[ADMIN_REWARD_CATEGORY_GET_BY_ID]",
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
     * VALIDATION ERROR
     * --------------------------------------------------------
     */

    if (
      message ===
      "Reward category ID tidak valid."
    ) {
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
 * PATCH /api/admin/reward-categories/[id]
 * ============================================================
 *
 * UPDATE CATEGORY
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
 * Semua field bersifat optional.
 *
 * ============================================================
 */

export async function PATCH(
  request: Request,
  context: RouteContext
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
     * GET PARAMETER
     * --------------------------------------------------------
     */

    const {
      id,
    } = await context.params;

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
     * PARSE FIELDS
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
     *
     * Jika field dikirim tetapi tipenya salah,
     * jangan diam-diam mengabaikannya.
     */

    if (
      data.name !== undefined &&
      name === undefined
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
      slug === undefined
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
     * UPDATE
     * --------------------------------------------------------
     */

    const category =
      await AdminRewardCategoryService.update(
        id,
        {
          ...(name !== undefined && {
            name,
          }),

          ...(slug !== undefined && {
            slug,
          }),

          ...(sortOrder !== undefined && {
            sortOrder,
          }),

          ...(isActive !== undefined && {
            isActive,
          }),
        }
      );

    /**
     * --------------------------------------------------------
     * SUCCESS
     * --------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      data: category,
    });
  } catch (error) {
    console.error(
      "[ADMIN_REWARD_CATEGORY_UPDATE]",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Gagal memperbarui reward category.";

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
     * INVALID ID
     * --------------------------------------------------------
     */

    if (
      message ===
      "Reward category ID tidak valid."
    ) {
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
     * NO DATA
     * --------------------------------------------------------
     */

    if (
      message ===
      "Tidak ada data reward category yang diperbarui."
    ) {
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
