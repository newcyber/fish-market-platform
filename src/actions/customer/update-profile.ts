"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";

import CustomerService from "@/services/customer/customer.service";

import {
  CustomerProfileSchema,
  type CustomerProfileInput,
} from "@/validations/customer/profile.schema";

/**
 * ============================================================
 * UPDATE CUSTOMER PROFILE ACTION
 * ============================================================
 */

export async function updateCustomerProfileAction(
  input: CustomerProfileInput
) {
  try {
    /**
     * ========================================================
     * AUTHENTICATION
     * ========================================================
     */

    const session =
      await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message:
          "Sesi Anda telah berakhir. Silakan login kembali.",
      };
    }

    /**
     * ========================================================
     * VALIDATE INPUT
     * ========================================================
     */

    const parsed =
      CustomerProfileSchema.safeParse(
        input
      );

    if (!parsed.success) {
      const fieldErrors =
        parsed.error.flatten()
          .fieldErrors;

      return {
        success: false,
        message:
          "Data profil tidak valid.",
        fieldErrors,
      };
    }

    /**
     * ========================================================
     * PREPARE DATA
     * ========================================================
     */

    const phone =
      parsed.data.phone?.trim() ||
      undefined;

    /**
     * ========================================================
     * UPDATE PROFILE
     * ========================================================
     */

    await CustomerService.updateCustomer(
      session.user.id,
      {
        name:
          parsed.data.name.trim(),

        phone,
      }
    );

    /**
     * ========================================================
     * REVALIDATE CACHE
     * ========================================================
     */

    revalidatePath(
  "/customer/profile"
);

revalidatePath(
  "/customer",
  "layout"
);

    return {
      success: true,
      message:
        "Profil berhasil diperbarui.",
    };
  } catch (error) {
    console.error(
      "[UPDATE_CUSTOMER_PROFILE_ERROR]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memperbarui profil.",
    };
  }
}