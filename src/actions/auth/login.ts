"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";

import {
  LoginSchema,
  type LoginInput,
} from "@/validations/auth/login.schema";

export interface LoginResult {
  success: boolean;

  message?: string;

  fieldErrors?: Partial<
    Record<keyof LoginInput, string>
  >;
}

export async function login(
  values: LoginInput
): Promise<LoginResult> {
  const parsed = LoginSchema.safeParse({
    email: values.email.trim().toLowerCase(),
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
        fieldErrors[field as keyof LoginInput] =
          issue.message;
      }
    }

    return {
      success: false,
      message: "Data login tidak valid.",
      fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    return {
      success: true,
      message: "Login berhasil.",
    };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            message: "Email atau password salah.",
          };

        default:
          return {
            success: false,
            message: "Autentikasi gagal.",
          };
      }
    }

    console.error("[LOGIN_ACTION]", error);

    return {
      success: false,
      message:
        "Terjadi kesalahan pada server.",
    };
  }
}