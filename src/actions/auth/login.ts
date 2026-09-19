"use server";

import { Role } from "@prisma/client";
import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { UserRepository } from "@/repositories/user.repository";
import AddressService from "@/services/address/address.service";
import {
  LoginSchema,
  type LoginInput,
} from "@/validations/auth/login.schema";

/**
 * ============================================================
 * LOGIN RESULT
 * ============================================================
 */

export interface LoginResult {
  success: boolean;

  message?: string;

  /**
   * Role user setelah login berhasil.
   */
  role?: Role;

  /**
   * Menandakan customer memiliki minimal
   * satu alamat aktif.
   */
  hasAddress?: boolean;

  /**
   * Error code untuk ditangani oleh frontend.
   */
  code?: string;

  fieldErrors?: Partial<
    Record<keyof LoginInput, string>
  >;
}

/**
 * ============================================================
 * LOGIN ACTION
 * ============================================================
 */

export async function login(
  values: LoginInput
): Promise<LoginResult> {
  /**
   * ==========================================================
   * VALIDATE INPUT
   * ==========================================================
   */

  const parsed = LoginSchema.safeParse({
    email: values.email
      .trim()
      .toLowerCase(),

    password: values.password,
  });

  if (!parsed.success) {
    const fieldErrors: Partial<
      Record<keyof LoginInput, string>
    > = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];

      if (
        typeof field === "string" &&
        !(field in fieldErrors)
      ) {
        fieldErrors[
          field as keyof LoginInput
        ] = issue.message;
      }
    }

    return {
      success: false,

      message:
        "Data login tidak valid.",

      fieldErrors,
    };
  }

  /**
   * ==========================================================
   * AUTHENTICATE USER
   * ==========================================================
   */

  try {
    await signIn(
      "credentials",
      {
        email:
          parsed.data.email,

        password:
          parsed.data.password,

        redirect: false,
      }
    );

    /**
     * ========================================================
     * GET AUTHENTICATED USER ROLE
     * ========================================================
     *
     * signIn() di atas sudah melakukan:
     *
     * - validasi credentials
     * - pengecekan user aktif
     * - pengecekan email verification
     * - validasi password
     *
     * Kita mengambil user kembali hanya untuk mendapatkan
     * role yang akan dikirim ke LoginForm sebagai dasar
     * penentuan redirect.
     */

    const authenticatedUser =
      await UserRepository.findForAuth(
        parsed.data.email
      );

    if (!authenticatedUser) {
      console.error(
        "[LOGIN_ACTION] Authenticated user tidak ditemukan setelah signIn."
      );

      return {
        success: false,

        message:
          "User tidak ditemukan setelah autentikasi.",
      };
    }

    /**
     * ========================================================
     * CHECK CUSTOMER ADDRESS
     * ========================================================
     *
     * Hanya CUSTOMER yang membutuhkan pengecekan alamat.
     *
     * Admin dan Super Admin tidak perlu memiliki alamat
     * customer untuk masuk ke dashboard admin.
     */
    let hasAddress: boolean | undefined;

    if (authenticatedUser.role === Role.CUSTOMER) {
      hasAddress =
        await AddressService.hasActiveAddress(
          authenticatedUser.id
        );
    }

    return {
      success: true,

      message:
        "Login berhasil.",

      role:
        authenticatedUser.role,

      hasAddress,
    };

  } catch (error) {
    /**
     * ========================================================
     * AUTH ERROR
     * ========================================================
     */

    if (
      error instanceof AuthError
    ) {
      /**
       * ======================================================
       * EMAIL NOT VERIFIED
       * ======================================================
       */

      if (
        error.cause?.err instanceof Error &&
        error.cause.err.message ===
          "EMAIL_NOT_VERIFIED"
      ) {
        return {
          success: false,

          code:
            "EMAIL_NOT_VERIFIED",

          message:
            "Email Anda belum diverifikasi. Silakan verifikasi email terlebih dahulu.",
        };
      }

      /**
       * ======================================================
       * INVALID CREDENTIALS
       * ======================================================
       */

      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,

            message:
              "Email atau password salah.",
          };

        default:
          return {
            success: false,

            message:
              "Autentikasi gagal.",
          };
      }
    }

    console.error(
      "[LOGIN_ACTION]",
      error
    );

    return {
      success: false,

      message:
        "Terjadi kesalahan pada server.",
    };
  }
}