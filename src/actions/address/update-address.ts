"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import AddressService from "@/services/address/address.service";

export async function updateAddressAction(
  addressId: string,
  data: {
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
  }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Anda harus login terlebih dahulu.",
      };
    }

    const result =
      await AddressService.updateAddress(
        session.user.id,
        addressId,
        data
      );

    if (!result.success) {
      return {
        success: false,
        message:
          result.message ??
          "Gagal memperbarui alamat.",
      };
    }

    revalidatePath("/customer/addresses");
    revalidatePath("/customer/checkout");

    return {
      success: true,
      message:
        result.message ??
        "Alamat berhasil diperbarui.",
    };
  } catch (error) {
    console.error(
      "[UPDATE_ADDRESS_ACTION_ERROR]",
      error
    );

    return {
      success: false,
      message:
        "Terjadi kesalahan saat memperbarui alamat.",
    };
  }
}