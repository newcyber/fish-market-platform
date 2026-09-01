import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/auth/admin";

import {
  AdminRewardCatalogService,
} from "@/services/reward/admin-reward-catalog.service";

import {
  StorageService,
} from "@/services/storage/storage.service";

/**
 * ============================================================
 * ROUTE CONTEXT
 * ============================================================
 */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * ============================================================
 * REQUEST BODY
 * ============================================================
 */

type UpdateRewardRequestBody = {
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
 * GET /api/admin/reward-catalog/:id
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
     * GET ID
     * --------------------------------------------------------
     */

    const {
      id,
    } = await context.params;

    /**
     * --------------------------------------------------------
     * GET REWARD
     * --------------------------------------------------------
     */

    const reward =
      await AdminRewardCatalogService.getById(
        id
      );

    /**
     * --------------------------------------------------------
     * SUCCESS
     * --------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      data:
        reward,
    });
  } catch (error) {
    console.error(
      "[ADMIN_REWARD_CATALOG_GET_BY_ID]",
      error
    );

    const authResponse =
      authErrorResponse(
        error,
        "Gagal mengambil reward catalog."
      );

    if (
      authResponse
    ) {
      return authResponse;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Gagal mengambil reward catalog.";

    /**
     * --------------------------------------------------------
     * NOT FOUND
     * --------------------------------------------------------
     */

    if (
      message ===
      "Reward tidak ditemukan."
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
}

/**
 * ============================================================
 * PATCH /api/admin/reward-catalog/:id
 * ============================================================
 *
 * UPDATE REWARD
 *
 * Content-Type:
 *
 * application/json
 *
 * Image upload TIDAK dilakukan di endpoint ini.
 *
 * Jika admin memilih gambar baru:
 *
 * 1. Form upload ke:
 *
 *    POST /api/admin/reward-catalog/upload
 *
 * 2. Endpoint upload mengembalikan path:
 *
 *    /uploads/rewards/xxxxx.webp
 *
 * 3. Path tersebut dikirim ke PATCH.
 *
 * 4. Database di-update.
 *
 * 5. Setelah database berhasil:
 *
 *    image lama dihapus dari storage.
 *
 * Jika PATCH gagal:
 *
 * - image lama tetap aman
 * - image baru dibersihkan
 *
 * ============================================================
 */

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  /**
   * Path image baru yang akan dibersihkan
   * jika proses database gagal.
   */

  let newImagePath:
    | string
    | null = null;

  try {
    /**
     * ========================================================
     * AUTHORIZATION
     * ========================================================
     */

    await requireAdmin();

    /**
     * ========================================================
     * GET ID
     * ========================================================
     */

    const {
      id,
    } = await context.params;

    /**
     * ========================================================
     * GET EXISTING REWARD
     * ========================================================
     *
     * Dibutuhkan untuk:
     *
     * - memastikan reward ada
     * - mendapatkan image lama
     * - mendapatkan category lama
     *
     * Category lama akan digunakan oleh service untuk
     * menentukan apakah category inactive masih boleh
     * dipertahankan.
     */

    const existing =
      await AdminRewardCatalogService.getById(
        id
      );

    /**
     * ========================================================
     * PARSE JSON
     * ========================================================
     */

    let body:
      | UpdateRewardRequestBody
      | null = null;

    try {
      body =
        (await request.json()) as
          UpdateRewardRequestBody;
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
     * ========================================================
     * ENSURE OBJECT
     * ========================================================
     */

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
     * BUILD UPDATE DATA
     * ========================================================
     */

    const updateData: {
      name?: string;

      description?: string | null;

      image?: string | null;

      categoryId?: string | null;

      requiredPoints?: number;

      stock?: number;

      isActive?: boolean;

      sortOrder?: number;
    } = {};

    /**
     * ========================================================
     * NAME
     * ========================================================
     */

    if (
      body.name !== undefined
    ) {
      if (
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

      updateData.name =
        body.name;
    }

    /**
     * ========================================================
     * DESCRIPTION
     * ========================================================
     *
     * null diperbolehkan untuk menghapus deskripsi.
     */

    if (
      body.description !== undefined
    ) {
      if (
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

      updateData.description =
        body.description;
    }

    /**
     * ========================================================
     * IMAGE
     * ========================================================
     *
     * Image harus berupa string path hasil upload.
     *
     * null diperbolehkan.
     */

    if (
      body.image !== undefined
    ) {
      if (
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

      const normalizedImage =
        typeof body.image === "string"
          ? body.image.trim()
          : null;

      updateData.image =
        normalizedImage ||
        null;

      /**
       * ------------------------------------------------------
       * NEW IMAGE CLEANUP TRACKING
       * ------------------------------------------------------
       *
       * Hanya path dari:
       *
       * /uploads/rewards/
       *
       * yang dianggap sebagai image baru milik
       * reward catalog.
       */

      if (
        normalizedImage &&
        normalizedImage.startsWith(
          "/uploads/rewards/"
        ) &&
        normalizedImage !== existing.image
      ) {
        newImagePath =
          normalizedImage;
      }
    }

    /**
     * ========================================================
     * CATEGORY ID
     * ========================================================
     *
     * Jika categoryId dikirim:
     *
     * - harus string
     * - tidak boleh kosong
     *
     * Validasi keberadaan category dan status active
     * dilakukan oleh AdminRewardCatalogService.
     *
     * Service juga mengetahui existing.categoryId sehingga
     * category inactive yang memang sudah terpasang pada
     * reward tersebut tetap dapat dipertahankan.
     */

    if (
      body.categoryId !== undefined
    ) {
      if (
        body.categoryId !== null &&
        typeof body.categoryId !== "string"
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Kategori reward tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      const normalizedCategoryId =
        typeof body.categoryId === "string"
          ? body.categoryId.trim()
          : "";

      if (
        !normalizedCategoryId
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

      updateData.categoryId =
        normalizedCategoryId;
    }

    /**
     * ========================================================
     * REQUIRED POINTS
     * ========================================================
     */

    if (
      body.requiredPoints !== undefined
    ) {
      if (
        typeof body.requiredPoints !== "number" ||
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

      updateData.requiredPoints =
        body.requiredPoints;
    }

    /**
     * ========================================================
     * STOCK
     * ========================================================
     */

    if (
      body.stock !== undefined
    ) {
      if (
        typeof body.stock !== "number" ||
        !Number.isInteger(
          body.stock
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

      updateData.stock =
        body.stock;
    }

    /**
     * ========================================================
     * ACTIVE STATUS
     * ========================================================
     */

    if (
      body.isActive !== undefined
    ) {
      if (
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

      updateData.isActive =
        body.isActive;
    }

    /**
     * ========================================================
     * SORT ORDER
     * ========================================================
     */

    if (
      body.sortOrder !== undefined
    ) {
      if (
        typeof body.sortOrder !== "number" ||
        !Number.isInteger(
          body.sortOrder
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

      updateData.sortOrder =
        body.sortOrder;
    }

    /**
     * ========================================================
     * UPDATE DATABASE
     * ========================================================
     *
     * Service akan:
     *
     * - validasi field
     * - validasi category
     * - memastikan category ada
     * - memastikan category aktif jika category baru
     * - mempertahankan category inactive lama jika memang
     *   sudah digunakan reward tersebut
     */

    const reward =
      await AdminRewardCatalogService.update(
        id,
        updateData
      );

    /**
     * ========================================================
     * DELETE OLD IMAGE
     * ========================================================
     *
     * Hanya dilakukan setelah database berhasil.
     *
     * Ini penting supaya image lama tidak hilang apabila
     * proses update database gagal.
     */

    if (
      newImagePath &&
      existing.image &&
      existing.image !==
        newImagePath
    ) {
      try {
        await StorageService.deleteRewardImage(
          existing.image
        );
      } catch (cleanupError) {
        /**
         * Cleanup image lama gagal.
         *
         * Database tetap dianggap berhasil karena reward
         * sudah tersimpan dengan benar.
         */

        console.error(
          "[ADMIN_REWARD_CATALOG_OLD_IMAGE_DELETE]",
          cleanupError
        );
      }
    }

    /**
     * ========================================================
     * SUCCESS
     * ========================================================
     */

    return NextResponse.json({
      success: true,

      data:
        reward,
    });
  } catch (error) {
    /**
     * ========================================================
     * CLEANUP NEW IMAGE
     * ========================================================
     *
     * Jika database gagal setelah image baru berhasil
     * diupload, hapus image baru.
     *
     * Image lama tidak disentuh.
     */

    if (
      newImagePath
    ) {
      try {
        await StorageService.deleteRewardImage(
          newImagePath
        );
      } catch (cleanupError) {
        console.error(
          "[ADMIN_REWARD_CATALOG_UPDATE_CLEANUP]",
          cleanupError
        );
      }
    }

    /**
     * ========================================================
     * ERROR LOG
     * ========================================================
     */

    console.error(
      "[ADMIN_REWARD_CATALOG_UPDATE]",
      error
    );

    /**
     * ========================================================
     * AUTH ERROR
     * ========================================================
     */

    const authResponse =
      authErrorResponse(
        error,
        "Gagal memperbarui reward catalog."
      );

    if (
      authResponse
    ) {
      return authResponse;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Gagal memperbarui reward catalog.";

    /**
     * ========================================================
     * NOT FOUND
     * ========================================================
     */

    if (
      message ===
      "Reward tidak ditemukan."
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
     * ========================================================
     * VALIDATION / BUSINESS ERROR
     * ========================================================
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

/**
 * ============================================================
 * DELETE /api/admin/reward-catalog/:id
 * ============================================================
 *
 * DELETE REWARD
 *
 * Rules:
 *
 * 1. Reward harus ada.
 * 2. Reward belum pernah memiliki RewardClaim.
 * 3. Jika database berhasil dihapus, image reward dihapus
 *    dari storage.
 *
 * Reward yang sudah memiliki histori claim TIDAK dapat
 * dihapus secara permanen.
 *
 * Gunakan Edit → Nonaktifkan untuk reward tersebut.
 *
 * ============================================================
 */

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    /**
     * ========================================================
     * AUTHORIZATION
     * ========================================================
     */

    await requireAdmin();

    /**
     * ========================================================
     * GET ID
     * ========================================================
     */

    const {
      id,
    } = await context.params;

    /**
     * ========================================================
     * GET EXISTING REWARD
     * ========================================================
     *
     * Image lama dibutuhkan untuk cleanup storage setelah
     * database berhasil dihapus.
     */

    const existing =
      await AdminRewardCatalogService.getById(
        id
      );

    /**
     * ========================================================
     * DELETE DATABASE
     * ========================================================
     *
     * Service akan memastikan reward belum memiliki claim.
     */

    await AdminRewardCatalogService.delete(
      id
    );

    /**
     * ========================================================
     * DELETE IMAGE
     * ========================================================
     *
     * Database sudah berhasil dihapus.
     *
     * Jika image cleanup gagal, jangan membatalkan response
     * karena record database sudah benar-benar terhapus.
     */

    if (
      existing.image
    ) {
      try {
        await StorageService.deleteRewardImage(
          existing.image
        );
      } catch (cleanupError) {
        console.error(
          "[ADMIN_REWARD_CATALOG_DELETE_IMAGE_CLEANUP]",
          cleanupError
        );
      }
    }

    /**
     * ========================================================
     * SUCCESS
     * ========================================================
     */

    return NextResponse.json({
      success: true,

      message:
        "Reward berhasil dihapus.",
    });
  } catch (error) {
    console.error(
      "[ADMIN_REWARD_CATALOG_DELETE]",
      error
    );

    /**
     * ========================================================
     * AUTH ERROR
     * ========================================================
     */

    const authResponse =
      authErrorResponse(
        error,
        "Gagal menghapus reward catalog."
      );

    if (
      authResponse
    ) {
      return authResponse;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Gagal menghapus reward catalog.";

    /**
     * ========================================================
     * NOT FOUND
     * ========================================================
     */

    if (
      message ===
      "Reward tidak ditemukan."
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
     * ========================================================
     * CLAIM HISTORY PROTECTION
     * ========================================================
     */

    if (
      message.includes(
        "sudah memiliki histori penukaran"
      )
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
     * ========================================================
     * GENERIC ERROR
     * ========================================================
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
