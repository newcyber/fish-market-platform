"use server";

import { Role } from "@prisma/client";

import CustomerService from "@/services/customer/customer.service";
import {
  RegisterSchema,
  type RegisterInput,
} from "@/validations/auth/register.schema";

/**
 * ============================================================
 * REGISTER CUSTOMER ACTION
 * ============================================================
 *
 * Action untuk registrasi customer dari halaman publik.
 *
 * Role dan status akun ditentukan langsung oleh server
 * agar tidak dapat dimanipulasi dari client.
 *
 * ============================================================
 */

export async function registerCustomerAction(
  input: RegisterInput
) {
  try {
    /**
     * ========================================================
     * VALIDATE INPUT
     * ========================================================
     */

    const parsed =
      RegisterSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,

        message:
          parsed.error.issues[0]?.message ??
          "Data registrasi tidak valid.",
      };
    }

    const {
      name,
      email,
      password,
    } = parsed.data;

    /**
     * ========================================================
     * CREATE CUSTOMER
     * ========================================================
     *
     * Role tidak berasal dari client.
     *
     * Semua registrasi publik selalu menjadi CUSTOMER.
     */

    const customer =
      await CustomerService.createCustomer({
        name,
        email,
        password,

        role: Role.CUSTOMER,

        isActive: true,
      });

    return {
      success: true,

      message:
        "Registrasi berhasil. Silakan login menggunakan akun Anda.",

      data: {
        id: customer.id,

        name: customer.name,

        email: customer.email,
      },
    };
  } catch (error) {
    console.error(
      "[REGISTER_CUSTOMER_ACTION_ERROR]",
      error
    );

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat melakukan registrasi.",
    };
  }
}