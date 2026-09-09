import {
  mobileError,
  mobileSuccess,
  mobileValidationError,
} from "@/lib/api/mobile-response";

import {
  MobileAuthError,
  requireMobileAuth,
} from "@/lib/auth/mobile-auth";

import AddressRepository from "@/repositories/address/address.repository";
import AddressService from "@/services/address/address.service";

import {
  addressSchema,
} from "@/validators/address/address.schema";

/**
 * ============================================================
 * MOBILE ADDRESS DETAIL API
 * ============================================================
 *
 * GET    /api/mobile/addresses/[addressId]
 * PUT    /api/mobile/addresses/[addressId]
 * PATCH  /api/mobile/addresses/[addressId]
 * DELETE /api/mobile/addresses/[addressId]
 *
 * Authentication:
 * Authorization: Bearer <accessToken>
 *
 * User ID TIDAK pernah diterima dari request.
 * User ID selalu berasal dari access token yang sudah
 * diverifikasi oleh requireMobileAuth().
 *
 * ============================================================
 */

interface AddressRouteContext {
  params: Promise<{
    addressId: string;
  }>;
}

/**
 * ============================================================
 * ADDRESS SERIALIZER
 * ============================================================
 */

function serializeAddress(address: {
  id: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  district: string;
  village: string;
  postalCode: string;
  fullAddress: string;
  latitude: unknown;
  longitude: unknown;
  label: string | null;
  notes: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: address.id,
    receiverName: address.receiverName,
    receiverPhone: address.receiverPhone,
    province: address.province,
    city: address.city,
    district: address.district,
    village: address.village,
    postalCode: address.postalCode,
    fullAddress: address.fullAddress,
    latitude:
      address.latitude !== null
        ? Number(address.latitude)
        : null,
    longitude:
      address.longitude !== null
        ? Number(address.longitude)
        : null,
    label: address.label,
    notes: address.notes,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}

/**
 * ============================================================
 * GET ADDRESS DETAIL
 * ============================================================
 */

export async function GET(
  request: Request,
  context: AddressRouteContext
) {
  try {
    const user =
      await requireMobileAuth(request);

    const { addressId } =
      await context.params;

    if (
      !addressId ||
      typeof addressId !== "string"
    ) {
      return mobileError(
        "ADDRESS_NOT_FOUND",
        "Alamat tidak ditemukan.",
        404
      );
    }

    const result =
      await AddressService.getAddressById(
        user.id,
        addressId
      );

    if (!result.success || !result.data) {
      if (
        result.message ===
          "Alamat tidak ditemukan." ||
        result.message ===
          "Anda tidak memiliki akses ke alamat ini."
      ) {
        return mobileError(
          "ADDRESS_NOT_FOUND",
          "Alamat tidak ditemukan.",
          404
        );
      }

      return mobileError(
        "ADDRESS_DETAIL_ERROR",
        result.message ??
          "Gagal mengambil alamat.",
        500
      );
    }

    return mobileSuccess({
      address: serializeAddress(result.data),
    });
  } catch (error) {
    return handleMobileAddressError(
      error,
      "[MOBILE_ADDRESS_GET_DETAIL_ERROR]"
    );
  }
}

/**
 * ============================================================
 * PATCH ADDRESS
 * ============================================================
 *
 * Update seluruh data alamat menggunakan schema Address
 * existing agar aturan Web dan Mobile tetap konsisten.
 *
 * userId berasal dari access token.
 * addressId berasal dari route params.
 */

async function updateAddressHandler(
  request: Request,
  context: AddressRouteContext
) {
  try {
    const user =
      await requireMobileAuth(request);

    const { addressId } =
      await context.params;

    if (
      !addressId ||
      typeof addressId !== "string"
    ) {
      return mobileError(
        "ADDRESS_NOT_FOUND",
        "Alamat tidak ditemukan.",
        404
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return mobileError(
        "INVALID_JSON",
        "Format request tidak valid.",
        400
      );
    }

    const updateAddressSchema =
      addressSchema.omit({
        isDefault: true,
    });

    const validation =
      updateAddressSchema.safeParse(body);

    if (!validation.success) {
      return mobileValidationError(
        "Data alamat tidak valid.",
        validation.error.flatten().fieldErrors
      );
    }

    const result =
      await AddressService.updateAddress(
        user.id,
        addressId,
        validation.data
      );

    if (!result.success) {
      if (
        result.message ===
          "Alamat tidak ditemukan." ||
        result.message ===
          "Anda tidak memiliki akses ke alamat ini."
      ) {
        return mobileError(
          "ADDRESS_NOT_FOUND",
          "Alamat tidak ditemukan.",
          404
        );
      }

      return mobileError(
        "ADDRESS_UPDATE_ERROR",
        result.message ??
          "Gagal memperbarui alamat.",
        400
      );
    }

    if (!result.data) {
      console.error(
        "[MOBILE_ADDRESS_UPDATE_ERROR]",
        "AddressService berhasil tetapi tidak mengembalikan data."
      );

      return mobileError(
        "ADDRESS_UPDATE_ERROR",
        "Alamat berhasil diperbarui tetapi data tidak dapat dikembalikan.",
        500
      );
    }

    return mobileSuccess({
      address: serializeAddress(result.data),
    });
    } catch (error) {
    return handleMobileAddressError(
      error,
      "[MOBILE_ADDRESS_UPDATE_ERROR]"
    );
  }
}

export async function PUT(
  request: Request,
  context: AddressRouteContext
) {
  return updateAddressHandler(request, context);
}

export async function PATCH(
  request: Request,
  context: AddressRouteContext
) {
  return updateAddressHandler(request, context);
}

/**
 * ============================================================
 * DELETE ADDRESS
 * ============================================================
 *
 * Soft-delete address.
 *
 * Jika address yang dihapus merupakan default,
 * repository akan memilih address aktif berikutnya
 * sebagai default dalam transaction.
 */

export async function DELETE(
  request: Request,
  context: AddressRouteContext
) {
  try {
    const user =
      await requireMobileAuth(request);

    const { addressId } =
      await context.params;

    if (
      !addressId ||
      typeof addressId !== "string"
    ) {
      return mobileError(
        "ADDRESS_NOT_FOUND",
        "Alamat tidak ditemukan.",
        404
      );
    }

    await AddressRepository.deleteAndPromoteDefault(
      user.id,
      addressId
    );

    return mobileSuccess({
      deleted: true,
      addressId,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ADDRESS_NOT_FOUND"
    ) {
      return mobileError(
        "ADDRESS_NOT_FOUND",
        "Alamat tidak ditemukan.",
        404
      );
    }

    return handleMobileAddressError(
      error,
      "[MOBILE_ADDRESS_DELETE_ERROR]"
    );
  }
}

/**
 * ============================================================
 * MOBILE ADDRESS ERROR HANDLER
 * ============================================================
 */

function handleMobileAddressError(
  error: unknown,
  logPrefix: string
) {
  if (error instanceof MobileAuthError) {
    switch (error.code) {
      case "MISSING_AUTHORIZATION":
        return mobileError(
          "MISSING_AUTHORIZATION",
          "Authorization header diperlukan.",
          401
        );

      case "INVALID_AUTHORIZATION":
        return mobileError(
          "INVALID_AUTHORIZATION",
          "Authorization header tidak valid.",
          401
        );

      case "INVALID_ACCESS_TOKEN":
        return mobileError(
          "INVALID_ACCESS_TOKEN",
          "Access token tidak valid atau sudah kedaluwarsa.",
          401
        );

      case "ACCOUNT_INACTIVE":
        return mobileError(
          "ACCOUNT_INACTIVE",
          "Akun Anda tidak dapat digunakan.",
          403
        );

      case "EMAIL_NOT_VERIFIED":
        return mobileError(
          "EMAIL_NOT_VERIFIED",
          "Email Anda belum diverifikasi.",
          403
        );

      case "SESSION_INVALIDATED":
        return mobileError(
          "SESSION_INVALIDATED",
          "Sesi aplikasi tidak berlaku karena password telah diubah. Silakan login kembali.",
          401
        );
    }
  }

  console.error(
    logPrefix,
    error
  );

  return mobileError(
    "INTERNAL_ERROR",
    "Terjadi kesalahan pada server.",
    500
  );
}
