import {
  NextRequest,
  NextResponse,
} from "next/server";

import { auth } from "@/auth";

import {
  claimReward,
} from "@/services/reward/reward-claim.service";

/**
 * ============================================================
 * POST /api/rewards/claims
 * ============================================================
 *
 * Customer melakukan claim reward fisik.
 *
 * Request body:
 *
 * {
 * "rewardCatalogId": "...",
 * "addressId": "..."
 * }
 *
 * SECURITY:
 *
 * userId TIDAK boleh dikirim dari client.
 *
 * userId selalu diambil dari:
 *
 * session.user.id
 *
 * sehingga customer tidak dapat melakukan claim
 * menggunakan ID customer lain.
 * ============================================================
 */

export async function POST(
  request: NextRequest
) {
  try {
    /**
     * ========================================================
     * 1. AUTHENTICATION
     * ========================================================
     */

    const session = await auth();

    if (
      !session?.user ||
      !session.user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda harus login untuk melakukan claim reward.",
        },
        {
          status: 401,
        }
      );
    }

    /**
     * ========================================================
     * 2. ACTIVE USER CHECK
     * ========================================================
     *
     * Jangan izinkan user yang sudah dinonaktifkan
     * melakukan transaksi reward.
     */

    if (!session.user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Akun Anda tidak aktif.",
        },
        {
          status: 403,
        }
      );
    }

    /**
     * ========================================================
     * 3. CUSTOMER ROLE CHECK
     * ========================================================
     *
     * Endpoint ini hanya boleh digunakan oleh CUSTOMER.
     *
     * Proteksi ini tetap diperlukan walaupun halaman
     * customer sudah memiliki role protection karena
     * endpoint API dapat dipanggil secara langsung.
     */

    if (
      session.user.role !== "CUSTOMER"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda tidak memiliki akses untuk melakukan claim reward.",
        },
        {
          status: 403,
        }
      );
    }

    /**
     * ========================================================
     * 4. PARSE REQUEST BODY
     * ========================================================
     */

    let body: unknown;

    try {
      body = await request.json();
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
     * 5. VALIDATE BODY
     * ========================================================
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

    const rewardCatalogId =
      "rewardCatalogId" in body &&
      typeof body.rewardCatalogId === "string"
        ? body.rewardCatalogId.trim()
        : "";

        const addressId =
  "addressId" in body &&
  typeof body.addressId === "string"
    ? body.addressId.trim()
    : "";

    if (!rewardCatalogId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Reward tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (!addressId) {
  return NextResponse.json(
    {
      success: false,
      message:
        "Alamat pengiriman wajib dipilih.",
    },
    {
      status: 400,
    }
  );
}

/**
 * ========================================================
 * 6. CLAIM REWARD
 * ========================================================
 *
 * userId berasal dari authenticated session.
 *
 * BUKAN dari request body.
 */

const result =
  await claimReward(
    session.user.id,
    rewardCatalogId,
    addressId
  );

/**
 * ========================================================
 * 7. SUCCESS RESPONSE
 * ========================================================
 */

return NextResponse.json(
  result,
  {
    status: 201,
  }
);
  } catch (error) {
    /**
     * ========================================================
     * ERROR HANDLING
     * ========================================================
     */

    console.error(
      "[POST /api/rewards/claims]",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat melakukan claim reward.";

    /**
     * ========================================================
     * KNOWN BUSINESS ERRORS
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

    if (
      message ===
      "Customer tidak ditemukan."
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

    if (
      message ===
      "Reward sedang tidak tersedia."
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

    if (
      message ===
      "Stok reward sudah habis."
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

    if (
      message ===
      "Stok hadiah sudah habis atau hadiah tidak ditemukan."
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

    if (
      message ===
      "Konfigurasi point reward tidak valid."
    ) {
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

    /**
     * ========================================================
     * INSUFFICIENT POINT
     * ========================================================
     */

    if (
      message.startsWith(
        "Point tidak mencukupi."
      )
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
     * ========================================================
     * FALLBACK
     * ========================================================
     */

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat melakukan claim reward.",
      },
      {
        status: 500,
      }
    );
  }
}
