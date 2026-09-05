"use client";

import Link from "next/link";

import {
  useForm,
  type SubmitHandler,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  toast,
} from "sonner";

import {
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

import {
  registerCustomerAction,
} from "@/actions/auth/register";

import {
  AuthCard,
} from "@/components/auth/AuthCard";

import {
  AuthHeader,
} from "@/components/auth/AuthHeader";

import {
  PasswordField,
} from "@/components/auth/PasswordField";

import {
  SubmitButton,
} from "@/components/auth/SubmitButton";

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
  /**
   * ==========================================================
   * FORM
   * ==========================================================
   */

  const form =
    useForm<RegisterInput>({
      resolver:
        zodResolver(
          RegisterSchema
        ),

      defaultValues: {
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      },

      mode: "onSubmit",
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
       * REDIRECT TO VERIFY EMAIL
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

  /**
   * ==========================================================
   * STATE
   * ==========================================================
   */

  const isSubmitting =
    form.formState.isSubmitting;

  const {
    errors,
  } = form.formState;

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <AuthCard>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <AuthHeader
        title="Buat Akun"
        description="Daftar untuk mulai berbelanja."
      />

      {/* ======================================================
          FORM
      ====================================================== */}

      <form
        onSubmit={
          form.handleSubmit(
            onSubmit
          )
        }
        className="
          space-y-5
          sm:space-y-6
        "
        noValidate
      >
        {/* ====================================================
            NAME
        ==================================================== */}

        <div className="space-y-2">
          <label
            htmlFor="name"
            className="
              text-sm
              font-medium
              text-[var(--pisjo-navy)]
            "
          >
            Nama Lengkap
          </label>

          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Masukkan nama lengkap"
            disabled={isSubmitting}
            aria-invalid={
              !!errors.name
            }
            aria-describedby={
              errors.name
                ? "register-name-error"
                : undefined
            }
            {...form.register("name")}
            className="
              h-12
              w-full
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              text-base
              text-slate-900
              shadow-sm
              outline-none
              transition-all
              duration-200

              placeholder:text-slate-400

              hover:border-slate-300

              focus:border-[var(--pisjo-primary)]
              focus:bg-white
              focus:ring-4
              focus:ring-[var(--pisjo-primary)]/10
              focus:shadow-[0_0_0_1px_rgba(7,136,232,0.12)]

              disabled:cursor-not-allowed
              disabled:bg-slate-50
              disabled:opacity-60

              sm:text-sm
            "
          />

          {errors.name && (
            <p
              id="register-name-error"
              role="alert"
              className="
                flex
                items-start
                gap-1.5
                text-sm
                leading-5
                text-destructive
              "
            >
              <AlertCircle
                className="
                  mt-0.5
                  h-4
                  w-4
                  shrink-0
                "
                aria-hidden="true"
              />

              <span>
                {errors.name.message}
              </span>
            </p>
          )}
        </div>

        {/* ====================================================
            EMAIL
        ==================================================== */}

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="
              text-sm
              font-medium
              text-[var(--pisjo-navy)]
            "
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="nama@email.com"
            disabled={isSubmitting}
            aria-invalid={
              !!errors.email
            }
            aria-describedby={
              errors.email
                ? "register-email-error"
                : undefined
            }
            {...form.register("email")}
            className="
              h-12
              w-full
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              text-base
              text-slate-900
              shadow-sm
              outline-none
              transition-all
              duration-200

              placeholder:text-slate-400

              hover:border-slate-300

              focus:border-[var(--pisjo-primary)]
              focus:bg-white
              focus:ring-4
              focus:ring-[var(--pisjo-primary)]/10
              focus:shadow-[0_0_0_1px_rgba(7,136,232,0.12)]

              disabled:cursor-not-allowed
              disabled:bg-slate-50
              disabled:opacity-60

              sm:text-sm
            "
          />

          {errors.email && (
            <p
              id="register-email-error"
              role="alert"
              className="
                flex
                items-start
                gap-1.5
                text-sm
                leading-5
                text-destructive
              "
            >
              <AlertCircle
                className="
                  mt-0.5
                  h-4
                  w-4
                  shrink-0
                "
                aria-hidden="true"
              />

              <span>
                {errors.email.message}
              </span>
            </p>
          )}
        </div>

        {/* ====================================================
            PASSWORD
        ==================================================== */}

        <PasswordField
          label="Password"
          placeholder="Minimal 6 karakter"
          autoComplete="new-password"
          disabled={isSubmitting}
          required
          error={
            errors.password?.message
          }
          {...form.register(
            "password"
          )}
        />

        {/* ====================================================
            CONFIRM PASSWORD
        ==================================================== */}

        <PasswordField
          label="Konfirmasi Password"
          placeholder="Ulangi password"
          autoComplete="new-password"
          disabled={isSubmitting}
          required
          error={
            errors.confirmPassword
              ?.message
          }
          {...form.register(
            "confirmPassword"
          )}
        />

        {/* ====================================================
            SECURITY INFORMATION
        ==================================================== */}

        <div
          className="
            flex
            items-start
            gap-2.5
            rounded-xl
            border
            border-[var(--pisjo-soft-blue)]
            bg-[var(--pisjo-soft-blue)]
            px-3.5
            py-3
            text-xs
            leading-5
            text-[var(--pisjo-ocean)]
          "
        >
          <ShieldCheck
            className="
              mt-0.5
              h-4
              w-4
              shrink-0
              text-[var(--pisjo-primary)]
            "
            aria-hidden="true"
          />

          <p>
            Gunakan password yang kuat
            dan mudah Anda ingat untuk
            menjaga keamanan akun.
          </p>
        </div>

        {/* ====================================================
            SUBMIT
        ==================================================== */}

        <SubmitButton
          loading={isSubmitting}
          text="Daftar Sekarang"
          loadingText="Mendaftarkan..."
        />
      </form>

      {/* ======================================================
          LOGIN LINK
      ====================================================== */}

      <div
        className="
          mt-5
          text-center
          text-sm
          text-slate-500
          sm:mt-6
        "
      >
        <span>
          Sudah punya akun?
        </span>{" "}

        <Link
          href="/login"
          className="
            inline-flex
            min-h-11
            items-center
            font-semibold
            text-[var(--pisjo-ocean)]
            transition-colors
            duration-200
            hover:text-[var(--pisjo-primary)]
            hover:underline
            focus:outline-none
            focus-visible:rounded-md
            focus-visible:ring-2
            focus-visible:ring-[var(--pisjo-primary)]
            focus-visible:ring-offset-2
            sm:min-h-0
          "
        >
          Login di sini
        </Link>
      </div>
    </AuthCard>
  );
}
