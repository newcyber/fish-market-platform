"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  useForm,
  type SubmitHandler,
} from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
} from "lucide-react";

import { toast } from "sonner";

import { registerCustomerAction } from "@/actions/auth/register";

import {
  RegisterSchema,
  type RegisterInput,
} from "@/validations/auth/register.schema";

/**
 * ============================================================
 * REGISTER FORM
 * ============================================================
 *
 * Form registrasi customer publik.
 *
 * ============================================================
 */

export default function RegisterForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] =
    useState(false);

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
        await registerCustomerAction(data);

      if (!result.success) {
        toast.error(
          result.message ??
            "Registrasi gagal."
        );

        return;
      }

      toast.success(
        result.message ??
          "Registrasi berhasil."
      );

      /**
 * ==========================================================
 * REDIRECT TO EMAIL VERIFICATION
 * ==========================================================
 *
 * Setelah registrasi berhasil dan OTP dikirim,
 * arahkan customer ke halaman verifikasi email.
 */

if (
  result.data?.email &&
  result.data.requiresEmailVerification
) {
  router.push(
    `/verify-email?email=${encodeURIComponent(
      result.data.email
    )}`
  );

  router.refresh();

  return;
}

/**
 * Fallback jika flow verifikasi email tidak tersedia.
 */

router.push("/login");

router.refresh();
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
    <div className="w-full max-w-md">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Buat Akun
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Daftar untuk mulai berbelanja.
        </p>
      </div>

      {/* ======================================================
          FORM
      ====================================================== */}

      <form
        onSubmit={
          form.handleSubmit(onSubmit)
        }
        className="space-y-5"
      >
        {/* ====================================================
            NAME
        ==================================================== */}

        <div className="space-y-2">
          <label
            htmlFor="name"
            className="text-sm font-medium"
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
            className="flex h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />

          {form.formState.errors.name && (
            <p className="text-sm text-destructive">
              {
                form.formState.errors.name
                  .message
              }
            </p>
          )}
        </div>

        {/* ====================================================
            EMAIL
        ==================================================== */}

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium"
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
            className="flex h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />

          {form.formState.errors.email && (
            <p className="text-sm text-destructive">
              {
                form.formState.errors.email
                  .message
              }
            </p>
          )}
        </div>

        {/* ====================================================
            PASSWORD
        ==================================================== */}

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium"
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
              {...form.register("password")}
              className="flex h-11 w-full rounded-lg border bg-background px-3 pr-11 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (value) => !value
                )
              }
              disabled={isSubmitting}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
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

          {form.formState.errors.password && (
            <p className="text-sm text-destructive">
              {
                form.formState.errors.password
                  .message
              }
            </p>
          )}
        </div>

        {/* ====================================================
            CONFIRM PASSWORD
        ==================================================== */}

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium"
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
              className="flex h-11 w-full rounded-lg border bg-background px-3 pr-11 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(
                  (value) => !value
                )
              }
              disabled={isSubmitting}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
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

          {form.formState.errors
            .confirmPassword && (
            <p className="text-sm text-destructive">
              {
                form.formState.errors
                  .confirmPassword.message
              }
            </p>
          )}
        </div>

        {/* ====================================================
            SUBMIT
        ==================================================== */}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* ======================================================
          LOGIN LINK
      ====================================================== */}

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}

        <Link
          href="/login"
          className="font-medium text-primary transition hover:underline"
        >
          Login di sini
        </Link>
      </div>
    </div>
  );
}