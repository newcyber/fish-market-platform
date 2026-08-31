import { NextResponse } from "next/server";

import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";

import AddressRepository from "@/repositories/address/address.repository";

/**
 * ============================================================
 * MOBILE SET DEFAULT ADDRESS API
 * ============================================================
 *
 * PATCH /api/mobile/addresses/[addressId]/default
 *
 * Digunakan aplikasi Android untuk menjadikan satu alamat
 * sebagai alamat utama/default.
 *
 * Security:
 *
 * 1. User harus memiliki access token Mobile yang valid.
 * 2. addressId harus dimiliki oleh user tersebut.
 * 3. Address harus masih aktif.
 * 4. Perubahan default dilakukan secara transaction
 *    di AddressRepository.
 *
 * ============================================================
 */

interface SetDefaultAddressRouteContext {
  params: Promise<{
    addressId: string;
  }>;
}

/**
 * ============================================================
 * PATCH
 * ============================================================
 */

export async function PATCH(
  request: Request,
  context: SetDefaultAddressRouteContext
) {
  try {
    /**
     * --------------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------------
     */

    const user =
      await requireMobileAuth(
        request
      );

    /**
     * --------------------------------------------------------
     * PARAMS
     * --------------------------------------------------------
     */

    const { addressId } =
      await context.params;

    /**
     * --------------------------------------------------------
     * VALIDATE ADDRESS ID
     * --------------------------------------------------------
     */

    if (
      !addressId ||
      typeof addressId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,

          code:
            "ADDRESS_NOT_FOUND",

          message:
            "Alamat tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * SET DEFAULT
     * --------------------------------------------------------
     *
     * Repository akan memastikan:
     *
     * - addressId benar
     * - address milik user
     * - address belum dihapus
     *
     * Seluruh proses dilakukan dalam transaction.
     */

    const address =
      await AddressRepository.setDefault(
        user.id,
        addressId
      );

    /**
     * --------------------------------------------------------
     * SAFETY CHECK
     * --------------------------------------------------------
     */

    if (!address) {
      return NextResponse.json(
        {
          success: false,

          code:
            "ADDRESS_NOT_FOUND",

          message:
            "Alamat tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * SUCCESS
     * --------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Alamat utama berhasil diperbarui.",

        data: {
          address: {
            id: address.id,

            receiverName:
              address.receiverName,

            receiverPhone:
              address.receiverPhone,

            province:
              address.province,

            city:
              address.city,

            district:
              address.district,

            village:
              address.village,

            postalCode:
              address.postalCode,

            fullAddress:
              address.fullAddress,

            latitude:
              address.latitude !== null
                ? Number(
                    address.latitude.toString()
                  )
                : null,

            longitude:
              address.longitude !== null
                ? Number(
                    address.longitude.toString()
                  )
                : null,

            label:
              address.label,

            notes:
              address.notes,

            isDefault:
              address.isDefault,

            createdAt:
              address.createdAt,

            updatedAt:
              address.updatedAt,
          },
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    /**
     * ========================================================
     * MOBILE AUTH ERRORS
     * ========================================================
     */

    if (
      error instanceof MobileAuthError
    ) {
      switch (error.code) {
        case "MISSING_AUTHORIZATION":
        case "INVALID_AUTHORIZATION":
        case "INVALID_ACCESS_TOKEN":
        case "SESSION_INVALIDATED":
          return NextResponse.json(
            {
              success: false,

              code:
                error.code,

              message:
                error.message,
            },
            {
              status: 401,
            }
          );

        case "ACCOUNT_INACTIVE":
          return NextResponse.json(
            {
              success: false,

              code:
                error.code,

              message:
                error.message,
            },
            {
              status: 403,
            }
          );

        case "EMAIL_NOT_VERIFIED":
          return NextResponse.json(
            {
              success: false,

              code:
                error.code,

              message:
                error.message,
            },
            {
              status: 403,
            }
          );
      }
    }

    /**
     * ========================================================
     * ADDRESS NOT FOUND
     * ========================================================
     *
     * Error ini dilempar oleh repository ketika:
     *
     * - address tidak ada
     * - address bukan milik user
     * - address sudah soft-delete
     *
     * Jangan expose detail internal kepada client.
     */

    if (
      error instanceof Error &&
      error.message ===
        "ADDRESS_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,

          code:
            "ADDRESS_NOT_FOUND",

          message:
            "Alamat tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    /**
     * ========================================================
     * UNEXPECTED ERROR
     * ========================================================
     */

    console.error(
      "[MOBILE_SET_DEFAULT_ADDRESS_ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Terjadi kesalahan pada server.",
      },
      {
        status: 500,
      }
    );
  }
}
