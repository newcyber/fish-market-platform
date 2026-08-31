import { NextResponse } from "next/server";

import { requireMobileAuth } from "@/lib/auth/mobile-auth";
import AddressService from "@/services/address/address.service";
import {
  addressSchema,
} from "@/validators/address/address.schema";

/**
 * ============================================================
 * MOBILE ADDRESS API
 * ============================================================
 *
 * GET  /api/mobile/addresses
 * POST /api/mobile/addresses
 *
 * Authentication:
 *
 * Authorization: Bearer <accessToken>
 *
 * User ID TIDAK pernah diterima dari request.
 * User ID selalu berasal dari access token yang sudah
 * diverifikasi oleh requireMobileAuth().
 *
 * ============================================================
 */

/**
 * ============================================================
 * GET ADDRESSES
 * ============================================================
 *
 * Mengambil seluruh alamat milik user yang sedang login.
 */

export async function GET(
  request: Request
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
     * GET ADDRESSES
     * --------------------------------------------------------
     */

    const result =
      await AddressService.getAddressesByUserId(
        user.id
      );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,

          message:
            result.message ??
            "Gagal mengambil data alamat.",
        },
        {
          status: 500,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * SERIALIZE RESPONSE
     * --------------------------------------------------------
     *
     * Prisma Decimal dikonversi menjadi number
     * agar aman dan mudah digunakan Android.
     */

    const addresses =
      result.data.map(
        (address) => ({
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
        })
      );

    /**
     * --------------------------------------------------------
     * SUCCESS
     * --------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      data: {
        addresses,
      },
    });
  } catch (error) {
    return handleMobileAddressError(
      error,
      "[MOBILE_ADDRESS_GET_ERROR]"
    );
  }
}

/**
 * ============================================================
 * POST ADDRESS
 * ============================================================
 *
 * Membuat alamat baru untuk user yang sedang login.
 *
 * Client TIDAK boleh mengirim:
 *
 * - userId
 *
 * Karena userId diambil dari access token.
 */

export async function POST(
  request: Request
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
     * Gunakan schema yang sama dengan sistem Address
     * existing agar aturan Web dan Mobile konsisten.
     */

    const validation =
      addressSchema.safeParse(
        body
      );

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
     * CREATE ADDRESS
     * --------------------------------------------------------
     *
     * user.id berasal dari access token.
     */

    const result =
      await AddressService.createAddress(
        user.id,
        validation.data
      );

    /**
     * --------------------------------------------------------
     * SERVICE ERROR
     * --------------------------------------------------------
     */

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,

          message:
            result.message ??
            "Gagal menambahkan alamat.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * --------------------------------------------------------
     * SERIALIZE CREATED ADDRESS
     * --------------------------------------------------------
     */

    const address =
      result.data;

    if (!address) {
      console.error(
        "[MOBILE_ADDRESS_CREATE_ERROR]",
        "AddressService berhasil tetapi tidak mengembalikan data."
      );

      return NextResponse.json(
        {
          success: false,

          message:
            "Alamat berhasil diproses tetapi data tidak dapat dikembalikan.",
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

    return NextResponse.json(
      {
        success: true,

        message:
          result.message ??
          "Alamat berhasil ditambahkan.",

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
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return handleMobileAddressError(
      error,
      "[MOBILE_ADDRESS_CREATE_ERROR]"
    );
  }
}

/**
 * ============================================================
 * MOBILE ADDRESS ERROR HANDLER
 * ============================================================
 *
 * Menyatukan response error authentication untuk GET dan POST.
 */

function handleMobileAddressError(
  error: unknown,
  logPrefix: string
) {
  /**
   * --------------------------------------------------------
   * MOBILE AUTH ERRORS
   * --------------------------------------------------------
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
   * --------------------------------------------------------
   * UNEXPECTED ERROR
   * --------------------------------------------------------
   */

  console.error(
    logPrefix,
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
