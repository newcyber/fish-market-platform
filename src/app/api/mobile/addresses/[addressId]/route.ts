import { NextResponse } from "next/server";

import { requireMobileAuth } from "@/lib/auth/mobile-auth";
import AddressService from "@/services/address/address.service";
import {
  addressSchema,
} from "@/validators/address/address.schema";

/**
 * ============================================================
 * MOBILE ADDRESS DETAIL API
 * ============================================================
 *
 * PUT /api/mobile/addresses/[addressId]
 *
 * Mengupdate alamat milik user yang sedang login.
 *
 * Authentication:
 *
 * Authorization: Bearer <accessToken>
 *
 * ============================================================
 *
 * SECURITY
 *
 * addressId berasal dari URL.
 *
 * userId TIDAK berasal dari:
 *
 * - body
 * - query parameter
 * - custom header
 *
 * userId selalu berasal dari access token yang telah
 * diverifikasi oleh requireMobileAuth().
 *
 * Ownership kemudian diverifikasi kembali oleh
 * AddressService.updateAddress().
 *
 * ============================================================
 */

interface MobileAddressRouteContext {
  params: Promise<{
    addressId: string;
  }>;
}

/**
 * ============================================================
 * PUT UPDATE ADDRESS
 * ============================================================
 */

export async function PUT(
  request: Request,
  context: MobileAddressRouteContext
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
            "INVALID_ADDRESS_ID",

          message:
            "ID alamat tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * PARSE BODY
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

          code:
            "INVALID_JSON",

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
     * VALIDATE BODY
     * --------------------------------------------------------
     *
     * addressSchema juga memiliki field isDefault.
     *
     * Untuk PUT update detail alamat, isDefault tidak
     * digunakan di sini.
     *
     * Oleh karena itu kita membuat schema khusus dari
     * addressSchema dengan menghapus field isDefault.
     */

    const updateAddressSchema =
      addressSchema.omit({
        isDefault: true,
      });

    const validation =
      updateAddressSchema.safeParse(
        body
      );

    /**
     * --------------------------------------------------------
     * VALIDATION ERROR
     * --------------------------------------------------------
     */

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,

          code:
            "VALIDATION_ERROR",

          message:
            "Data alamat tidak valid.",

          errors:
            validation.error.flatten()
              .fieldErrors,
        },
        {
          status: 400,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * UPDATE ADDRESS
     * --------------------------------------------------------
     *
     * user.id berasal dari access token.
     *
     * AddressService kemudian memastikan address.userId
     * sama dengan user.id.
     */

    const result =
      await AddressService.updateAddress(
        user.id,
        addressId,
        validation.data
      );

    /**
     * --------------------------------------------------------
     * ADDRESS NOT FOUND / OWNERSHIP ERROR
     * --------------------------------------------------------
     */

    if (!result.success) {
      const message =
        result.message ??
        "Gagal memperbarui alamat.";

      /**
       * Jangan membocorkan detail ownership.
       *
       * Dari perspektif Mobile API, alamat yang tidak
       * ditemukan atau bukan milik user diperlakukan
       * sebagai resource yang tidak dapat diakses.
       */

      if (
        message ===
          "Alamat tidak ditemukan." ||
        message ===
          "Anda tidak memiliki akses ke alamat ini."
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
     * SERIALIZE ADDRESS
     * --------------------------------------------------------
     */

    const address =
      result.data;

    if (!address) {
      console.error(
        "[MOBILE_ADDRESS_UPDATE_ERROR]",
        "AddressService berhasil tetapi tidak mengembalikan data."
      );

      return NextResponse.json(
        {
          success: false,

          message:
            "Alamat berhasil diperbarui tetapi data tidak dapat dikembalikan.",
        },
        {
          status: 500,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * SUCCESS RESPONSE
     * --------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      message:
        result.message ??
        "Alamat berhasil diperbarui.",

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
              ? Number(address.latitude)
              : null,

          longitude:
            address.longitude !== null
              ? Number(address.longitude)
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
    });
  } catch (error) {
    /**
     * ========================================================
     * MOBILE AUTH ERRORS
     * ========================================================
     */

    if (
      error instanceof Error &&
      "code" in error
    ) {
      const authError =
        error as Error & {
          code?: string;
        };

      switch (
        authError.code
      ) {
        case "MISSING_AUTHORIZATION":
          return NextResponse.json(
            {
              success: false,

              code:
                "MISSING_AUTHORIZATION",

              message:
                "Authorization header diperlukan.",
            },
            {
              status: 401,
            }
          );

        case "INVALID_AUTHORIZATION":
          return NextResponse.json(
            {
              success: false,

              code:
                "INVALID_AUTHORIZATION",

              message:
                "Authorization header tidak valid.",
            },
            {
              status: 401,
            }
          );

        case "INVALID_ACCESS_TOKEN":
          return NextResponse.json(
            {
              success: false,

              code:
                "INVALID_ACCESS_TOKEN",

              message:
                "Access token tidak valid atau sudah kedaluwarsa.",
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
                "ACCOUNT_INACTIVE",

              message:
                "Akun Anda tidak dapat digunakan.",
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
                "EMAIL_NOT_VERIFIED",

              message:
                "Email Anda belum diverifikasi.",
            },
            {
              status: 403,
            }
          );

        case "SESSION_INVALIDATED":
          return NextResponse.json(
            {
              success: false,

              code:
                "SESSION_INVALIDATED",

              message:
                "Sesi aplikasi tidak berlaku karena password telah diubah. Silakan login kembali.",
            },
            {
              status: 401,
            }
          );
      }
    }

    /**
     * ========================================================
     * UNEXPECTED ERROR
     * ========================================================
     */

    console.error(
      "[MOBILE_ADDRESS_UPDATE_ERROR]",
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
