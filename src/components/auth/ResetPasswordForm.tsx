"use client";

import {
  useEffect,
  useState,
  useTransition,
} from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";

import {
  ResetPasswordSchema,
  type ResetPasswordInput,
} from "@/validations/auth/reset-password.schema";

import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { PasswordField } from "@/components/auth/PasswordField";
import { SubmitButton } from "@/components/auth/SubmitButton";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

/**
 * ============================================================
 * RESET PASSWORD FORM
 * ============================================================
 *
 * Membaca token dari:
 *
 * /reset-password?token=xxxxxxxx
 *
 * Mengirim password baru ke:
 *
 * POST /api/auth/reset-password
 */

export function ResetPasswordForm() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const token =
    searchParams.get("token");

  const [isPending, startTransition] =
    useTransition();

  const [serverError, setServerError] =
    useState("");

  const [isSuccess, setIsSuccess] =
    useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: {
      errors,
    },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(
      ResetPasswordSchema
    ),

    defaultValues: {
      token: token ?? "",
      password: "",
      confirmPassword: "",
    },

    mode: "onSubmit",
  });

  /**
   * ==========================================================
   * KEEP TOKEN IN FORM STATE
   * ==========================================================
   */

  useEffect(() => {
    if (!token) {
      return;
    }
  }, [token]);

  /**
   * ==========================================================
   * INVALID TOKEN
   * ==========================================================
   */

  if (!token) {
    return (
      <AuthCard>
        <AuthHeader
          title="Invalid Reset Link"
          description="Link untuk mengatur ulang password tidak valid atau token tidak ditemukan."
        />

        <Alert variant="destructive">
          <AlertTitle>
            Link tidak valid
          </AlertTitle>

          <AlertDescription>
            Silakan buat permintaan reset password
            baru.
          </AlertDescription>
        </Alert>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href="/forgot-password"
            className="font-medium text-primary transition hover:underline"
          >
            Request Reset Password
          </Link>
        </div>
      </AuthCard>
    );
  }

  /**
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */

  const onSubmit = (
    values: ResetPasswordInput
  ) => {
    setServerError("");

    startTransition(async () => {
      try {
        const response = await fetch(
          "/api/auth/reset-password",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              ...values,
              token,
            }),
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          /**
           * ==================================================
           * SERVER FIELD ERRORS
           * ==================================================
           */

          if (result.errors) {
            for (
              const [field, messages]
              of Object.entries(
                result.errors
              )
            ) {
              const message =
                Array.isArray(messages)
                  ? messages[0]
                  : messages;

              if (
                typeof message !== "string"
              ) {
                continue;
              }

              setError(
                field as keyof ResetPasswordInput,
                {
                  type: "server",
                  message,
                }
              );
            }
          }

          const message =
            result.message ??
            "Gagal mengatur ulang password.";

          setServerError(message);

          toast.error(message);

          return;
        }

        /**
         * ==================================================
         * SUCCESS
         * ==================================================
         */

        setIsSuccess(true);

        toast.success(
          result.message ??
            "Password berhasil diperbarui."
        );

        /**
         * Redirect setelah user sempat melihat success state.
         */

        window.setTimeout(() => {
          router.replace("/login");
        }, 2500);
      } catch (error) {
        console.error(
          "[RESET_PASSWORD_CLIENT_ERROR]",
          error
        );

        const message =
          "Terjadi kesalahan. Silakan coba lagi.";

        setServerError(message);

        toast.error(message);
      }
    });
  };

  /**
   * ==========================================================
   * SUCCESS STATE
   * ==========================================================
   */

  if (isSuccess) {
    return (
      <AuthCard>
        <AuthHeader
          title="Password Updated"
          description="Password Anda berhasil diperbarui."
        />

        <Alert>
          <AlertTitle>
            Berhasil
          </AlertTitle>

          <AlertDescription>
            Anda akan diarahkan ke halaman login
            dalam beberapa detik.
          </AlertDescription>
        </Alert>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-primary transition hover:underline"
          >
            Login Sekarang
          </Link>
        </div>
      </AuthCard>
    );
  }

  /**
   * ==========================================================
   * RESET PASSWORD FORM
   * ==========================================================
   */

  return (
    <AuthCard>
      <AuthHeader
        title="Reset Password"
        description="Masukkan password baru untuk akun Anda."
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        {/* ====================================================
            PASSWORD
        ==================================================== */}

        <PasswordField
          id="password"
          label="Password Baru"
          placeholder="Masukkan password baru"
          autoComplete="new-password"
          disabled={isPending}
          error={errors.password?.message}
          {...register("password")}
        />

        {/* ====================================================
            CONFIRM PASSWORD
        ==================================================== */}

        <PasswordField
          id="confirmPassword"
          label="Konfirmasi Password"
          placeholder="Masukkan ulang password"
          autoComplete="new-password"
          disabled={isPending}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {/* ====================================================
            SERVER ERROR
        ==================================================== */}

        {serverError && (
          <Alert variant="destructive">
            <AlertTitle>
              Reset Password Gagal
            </AlertTitle>

            <AlertDescription>
              {serverError}
            </AlertDescription>
          </Alert>
        )}

        {/* ====================================================
            SUBMIT
        ==================================================== */}

        <SubmitButton
          loading={isPending}
          text="Reset Password"
          loadingText="Resetting..."
        />
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Ingat password Anda?{" "}

        <Link
          href="/login"
          className="font-medium text-primary transition hover:underline"
        >
          Kembali ke Login
        </Link>
      </div>
    </AuthCard>
  );
}