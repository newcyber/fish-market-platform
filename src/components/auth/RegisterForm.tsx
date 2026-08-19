"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  useForm,
  type SubmitHandler,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
} from "lucide-react";

import {
  toast,
} from "sonner";

import {
  registerCustomerAction,
} from "@/actions/auth/register";

import {
  useAuthBranding,
} from "@/components/auth/AuthBrandingProvider";

import {
  RegisterSchema,
  type RegisterInput,
} from "@/validations/auth/register.schema";

/**
 * ============================================================
 * REGISTER FORM
 * ============================================================
 */

export default function RegisterForm() {
  const {
    storeName,
    siteLogo,
    storeInitial,
  } = useAuthBranding();

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  /**
   * ==========================================================
   * FORM
   * ==========================================================
   */

  const form =
    useForm<RegisterInput>({
      resolver:
        zodResolver(RegisterSchema),

      defaultValues: {
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      },
    });

  /**
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */

  const onSubmit: SubmitHandler<
    RegisterInput
  > = async (data) => {
    try {
      const result =
        await registerCustomerAction(
          data
        );

      /**
       * ========================================================
       * REGISTER FAILED
       * ========================================================
       */

      if (!result.success) {
        toast.error(
          result.message ??
            "Registrasi gagal."
        );

        return;
      }

      /**
       * ========================================================
       * REGISTER SUCCESS
       * ========================================================
       */

      toast.success(
        result.message ??
          "Registrasi berhasil."
      );

      const email =
        result.data?.email ??
        data.email;

      const requiresEmailVerification =
        result.data
          ?.requiresEmailVerification ===
        true;

      /**
       * ========================================================
       * REDIRECT TO EMAIL VERIFICATION
       * ========================================================
       */

      if (
        requiresEmailVerification &&
        email
      ) {
        const verifyEmailUrl =
          `/verify-email?email=${encodeURIComponent(
            email
          )}`;

        console.log(
          "[REGISTER_REDIRECT]",
          verifyEmailUrl
        );

        window.location.assign(
          verifyEmailUrl
        );

        return;
      }

      /**
       * ========================================================
       * FALLBACK
       * ========================================================
       */

      window.location.assign(
        "/login"
      );
    } catch (error) {
      console.error(
        "[REGISTER_FORM_ERROR]",
        error
      );

      toast.error(
        "Terjadi kesalahan saat melakukan registrasi."
      );
    }
  };

  const isSubmitting =
    form.formState.isSubmitting;

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl shadow-slate-950/10 sm:p-8">

      {/* ====================================================== */}
      {/* BRAND LOGO */}
      {/* ====================================================== */}

      <div className="mb-8 flex flex-col items-center text-center">

        <div className="relative mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">

          {siteLogo ? (
            <Image
              src={siteLogo}
              alt={`${storeName} Logo`}
              fill
              sizes="64px"
              className="object-contain p-1.5"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-sky-700 text-lg font-bold text-white">
              {storeInitial}
            </div>
          )}

        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Buat Akun
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Daftar untuk mulai berbelanja
          di {storeName}.
        </p>

      </div>

      {/* ====================================================== */}
      {/* FORM */}
      {/* ====================================================== */}

      <form
        onSubmit={
          form.handleSubmit(
            onSubmit
          )
        }
        className="space-y-5"
      >

        {/* NAME */}

        <div className="space-y-2">

          <label
            htmlFor="name"
            className="text-sm font-medium text-slate-700"
          >
            Nama Lengkap
          </label>

          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Masukkan nama lengkap"
            disabled={isSubmitting}
            {...form.register("name")}
            className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 disabled:cursor-not-allowed disabled:opacity-50"
          />

          {form.formState.errors.name && (
            <p className="text-sm text-destructive">
              {
                form.formState
                  .errors
                  .name
                  .message
              }
            </p>
          )}

        </div>

        {/* EMAIL */}

        <div className="space-y-2">

          <label
            htmlFor="email"
            className="text-sm font-medium text-slate-700"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            disabled={isSubmitting}
            {...form.register("email")}
            className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 disabled:cursor-not-allowed disabled:opacity-50"
          />

          {form.formState.errors.email && (
            <p className="text-sm text-destructive">
              {
                form.formState
                  .errors
                  .email
                  .message
              }
            </p>
          )}

        </div>

        {/* PASSWORD */}

        <div className="space-y-2">

          <label
            htmlFor="password"
            className="text-sm font-medium text-slate-700"
          >
            Password
          </label>

          <div className="relative">

            <input
              id="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              autoComplete="new-password"
              placeholder="Minimal 6 karakter"
              disabled={isSubmitting}
              {...form.register(
                "password"
              )}
              className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (value) => !value
                )
              }
              disabled={isSubmitting}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={
                showPassword
                  ? "Sembunyikan password"
                  : "Tampilkan password"
              }
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>

          </div>

          {form.formState
            .errors
            .password && (
            <p className="text-sm text-destructive">
              {
                form.formState
                  .errors
                  .password
                  .message
              }
            </p>
          )}

        </div>

        {/* CONFIRM PASSWORD */}

        <div className="space-y-2">

          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-slate-700"
          >
            Konfirmasi Password
          </label>

          <div className="relative">

            <input
              id="confirmPassword"
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              autoComplete="new-password"
              placeholder="Ulangi password"
              disabled={isSubmitting}
              {...form.register(
                "confirmPassword"
              )}
              className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(
                  (value) => !value
                )
              }
              disabled={isSubmitting}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={
                showConfirmPassword
                  ? "Sembunyikan konfirmasi password"
                  : "Tampilkan konfirmasi password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>

          </div>

          {form.formState
            .errors
            .confirmPassword && (
            <p className="text-sm text-destructive">
              {
                form.formState
                  .errors
                  .confirmPassword
                  .message
              }
            </p>
          )}

        </div>

        {/* SUBMIT */}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />

              Memproses...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />

              Daftar Sekarang
            </>
          )}
        </button>

      </form>

      {/* ====================================================== */}
      {/* LOGIN LINK */}
      {/* ====================================================== */}

      <div className="mt-6 text-center text-sm text-slate-500">

        Sudah punya akun?{" "}

        <Link
          href="/login"
          className="font-semibold text-sky-700 transition hover:text-sky-800 hover:underline"
        >
          Login di sini
        </Link>

      </div>

    </div>
  );
}