"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import AddressService from "@/services/address/address.service";

export async function createAddressAction(data: {
  receiverName: string;
  receiverPhone: string;

  province: string;
  city: string;
  district: string;
  village: string;

  postalCode: string;
  fullAddress: string;

  latitude?: number | null;
  longitude?: number | null;

  label?: string | null;
  notes?: string | null;

  isDefault?: boolean;
}) {
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
        message: "Anda harus login terlebih dahulu.",
      };
    }

    /**
     * ============================================================
     * CREATE ADDRESS
     * ============================================================
     */
    const result =
      await AddressService.createAddress(
        session.user.id,
        data
      );

    if (!result.success) {
      return {
        success: false,
        message:
          result.message ??
          "Gagal menambahkan alamat.",
      };
    }

    /**
     * ============================================================
     * REVALIDATE CUSTOMER PAGES
     * ============================================================
     */
    revalidatePath("/customer/addresses");
    revalidatePath("/customer/checkout");

    return {
      success: true,
      message:
        result.message ??
        "Alamat berhasil ditambahkan.",
    };
  } catch (error) {
    console.error(
      "[CREATE_ADDRESS_ACTION_ERROR]",
      error
    );

    return {
      success: false,
      message:
        "Terjadi kesalahan saat menambahkan alamat.",
    };
  }
}