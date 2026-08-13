"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import AddressService from "@/services/address/address.service";

export async function setDefaultAddressAction(
  addressId: string
) {
  try {
    /**
     * ============================================================
     * AUTHENTICATION
     * ============================================================
     */
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message:
          "Anda harus login terlebih dahulu.",
      };
    }

    /**
     * ============================================================
     * SET DEFAULT ADDRESS
     * ============================================================
     */
    const result =
      await AddressService.setDefaultAddress(
        session.user.id,
        addressId
      );

    if (!result.success) {
      return {
        success: false,
        message:
          result.message ??
          "Gagal menjadikan alamat sebagai alamat utama.",
      };
    }

    /**
     * ============================================================
     * REVALIDATE
     * ============================================================
     */
    revalidatePath("/customer/addresses");

    revalidatePath("/customer/checkout");

    return {
      success: true,
      message:
        "Alamat utama berhasil diperbarui.",
    };
  } catch (error) {
    console.error(
      "[SET_DEFAULT_ADDRESS_ACTION_ERROR]",
      error
    );

    return {
      success: false,
      message:
        "Terjadi kesalahan saat memperbarui alamat utama.",
    };
  }
}