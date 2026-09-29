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
 * PHONE NORMALIZER
 * ============================================================
 *
 * Format internal Pisjo Market:
 *
 * 081234567890
 *      ↓
 * 6281234567890
 *
 * +6281234567890
 *      ↓
 * 6281234567890
 *
 * 6281234567890
 *      ↓
 * 6281234567890
 *
 * Hanya digunakan apabila identifier terdeteksi
 * sebagai nomor HP.
 * ============================================================
 */

function normalizePhone(
  value: string
): string {
  const digits =
    value.replace(
      /\D/g,
      "",
    );

  if (!digits) {
    return "";
  }

  if (
    digits.startsWith("62")
  ) {
    return digits;
  }

  if (
    digits.startsWith("0")
  ) {
    return `62${digits.slice(1)}`;
  }

  return digits;
}

/**
 * ============================================================
 * IDENTIFIER DETECTOR
 * ============================================================
 */

function isPhoneIdentifier(
  value: string
): boolean {
  const normalized =
    value.trim();

  /**
   * Jika mengandung @, anggap email.
   */
  if (
    normalized.includes("@")
  ) {
    return false;
  }

  /**
   * Selain itu, selama memiliki digit,
   * kita perlakukan sebagai nomor HP.
   */
  return /\d/.test(
    normalized,
  );
}

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
   * Error code untuk ditangani frontend.
   */
  code?: string;

  fieldErrors?: Partial<
    Record<
      keyof LoginInput,
      string
    >
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

  const parsed =
    LoginSchema.safeParse({
      email:
        values.email.trim(),

      password:
        values.password,
    });

  if (!parsed.success) {
    const fieldErrors: Partial<
      Record<
        keyof LoginInput,
        string
      >
    > = {};

    for (
      const issue of
        parsed.error.issues
    ) {
      const field =
        issue.path[0];

      if (
        typeof field ===
          "string" &&
        !(
          field in
          fieldErrors
        )
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

  const identifier =
    parsed.data.email.trim();

  const password =
    parsed.data.password;

  const usingPhone =
    isPhoneIdentifier(
      identifier,
    );

  /**
   * ==========================================================
   * NORMALIZE IDENTIFIER
   * ==========================================================
   */

  const normalizedIdentifier =
    usingPhone
      ? normalizePhone(
          identifier,
        )
      : identifier.toLowerCase();

  if (
    !normalizedIdentifier
  ) {
    return {
      success: false,

      message:
        "Email atau nomor WhatsApp tidak valid.",

      fieldErrors: {
        email:
          "Masukkan email atau nomor WhatsApp yang valid.",
      },
    };
  }

  /**
   * ==========================================================
   * AUTHENTICATE USER
   * ==========================================================
   */

  try {
    /**
     * Auth.js Credentials Provider sekarang menerima
     * identifier melalui field `email`.
     *
     * Kita pertahankan nama field tersebut sementara
     * agar perubahan tetap incremental.
     */

    await signIn(
      "credentials",
      {
        email:
          normalizedIdentifier,

        password,

        redirect: false,
      },
    );

    /**
     * ========================================================
     * GET AUTHENTICATED USER
     * ========================================================
     *
     * Setelah signIn berhasil, cari user kembali.
     *
     * Email:
     *   findForAuth()
     *
     * Phone:
     *   findByPhone()
     *
     * Keduanya harus menghasilkan user yang sama
     * dengan yang digunakan Auth.js.
     */

    const authenticatedUser =
      usingPhone
        ? await UserRepository.findByPhone(
            normalizedIdentifier,
          )
        : await UserRepository.findForAuth(
            normalizedIdentifier,
          );

    if (
      !authenticatedUser
    ) {
      console.error(
        "[LOGIN_ACTION] Authenticated user tidak ditemukan setelah signIn.",
      );

      return {
        success: false,

        message:
          "User tidak ditemukan setelah autentikasi.",
      };
    }

    /**
     * ========================================================
     * ACTIVE ACCOUNT
     * ========================================================
     */

    if (
      !authenticatedUser.isActive
    ) {
      return {
        success: false,

        message:
          "Akun tidak aktif.",
      };
    }

    /**
     * ========================================================
     * CUSTOMER ADDRESS
     * ========================================================
     *
     * Hanya CUSTOMER yang membutuhkan pengecekan alamat.
     *
     * Admin dan Super Admin tidak perlu memiliki
     * alamat customer.
     */

    let hasAddress:
      | boolean
      | undefined;

    if (
      authenticatedUser.role ===
      Role.CUSTOMER
    ) {
      hasAddress =
        await AddressService.hasActiveAddress(
          authenticatedUser.id,
        );
    }

    /**
     * ========================================================
     * SUCCESS
     * ========================================================
     */

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
       *
       * Untuk login menggunakan nomor HP, kita tetap
       * menghormati status email verification yang saat ini
       * diwajibkan oleh credentials provider.
       */

      if (
        error.cause?.err instanceof
          Error &&
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

      switch (
        error.type
      ) {
        case "CredentialsSignin":
          return {
            success: false,

            message:
              "Email/nomor WhatsApp atau password salah.",
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
      error,
    );

    return {
      success: false,

      message:
        "Terjadi kesalahan pada server.",
    };
  }
}