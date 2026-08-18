"use client";

import { useState, useTransition } from "react";

import Link from "next/link";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";

import {
  ForgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/validations/auth/forgot-password.schema";

import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { SubmitButton } from "@/components/auth/SubmitButton";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * ============================================================
 * FORGOT PASSWORD FORM
 * ============================================================
 *
 * Mengirim request ke:
 *
 * POST /api/auth/forgot-password
 *
 * Security:
 *
 * API selalu memberikan respons generik agar email enumeration
 * tidak dapat dilakukan.
 */

export function ForgotPasswordForm() {
  const [isPending, startTransition] =
    useTransition();

  const [serverError, setServerError] =
    useState("");

  const [isSubmitted, setIsSubmitted] =
    useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: {
      errors,
    },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(
      ForgotPasswordSchema
    ),

    defaultValues: {
      email: "",
    },

    mode: "onSubmit",
  });

  /**
   * ==========================================================
   * HANDLE FORGOT PASSWORD
   * ==========================================================
   */

  const onSubmit = (
    values: ForgotPasswordInput
  ) => {
    setServerError("");

    startTransition(async () => {
      try {
        const response = await fetch(
          "/api/auth/forgot-password",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(values),
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          /**
           * ==================================================
           * FIELD ERRORS
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
                field as keyof ForgotPasswordInput,
                {
                  type: "server",
                  message,
                }
              );
            }
          }

          const message =
            result.message ??
            "Terjadi kesalahan saat memproses permintaan.";

          setServerError(message);

          toast.error(message);

          return;
        }

        /**
         * ==================================================
         * SUCCESS
         * ==================================================
         */

        setIsSubmitted(true);

        toast.success(
          result.message ??
            "Instruksi reset password telah diproses."
        );
      } catch (error) {
        console.error(
          "[FORGOT_PASSWORD_CLIENT_ERROR]",
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

  if (isSubmitted) {
    return (
      <AuthCard>
        <AuthHeader
          title="Check Your Email"
          description="Jika email tersebut terdaftar, instruksi untuk mengatur ulang password akan dikirim."
        />

        <Alert>
          <AlertTitle>
            Permintaan berhasil diproses
          </AlertTitle>

          <AlertDescription>
            Silakan periksa inbox dan folder spam
            email Anda.
          </AlertDescription>
        </Alert>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Sudah ingat password Anda?{" "}

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

  /**
   * ==========================================================
   * FORM
   * ==========================================================
   */

  return (
    <AuthCard>
      <AuthHeader
        title="Forgot Password?"
        description="Masukkan alamat email Anda dan kami akan membantu mengatur ulang password."
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        {/* ====================================================
            EMAIL
        ==================================================== */}

        <div className="space-y-2">
          <Label htmlFor="email">
            Email
          </Label>

          <Input
            id="email"
            type="email"
            placeholder="nama@email.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            disabled={isPending}
            {...register("email")}
          />

          {errors.email && (
            <p className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* ====================================================
            SERVER ERROR
        ==================================================== */}

        {serverError && (
          <Alert variant="destructive">
            <AlertTitle>
              Permintaan gagal
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
          text="Send Reset Link"
          loadingText="Sending..."
        />
      </form>

      {/* ======================================================
          LOGIN LINK
      ====================================================== */}

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