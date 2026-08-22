"use client";

import {
  useState,
  useTransition,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  toast,
} from "sonner";

import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
} from "lucide-react";

import {
  ResetPasswordSchema,
  type ResetPasswordInput,
} from "@/validations/auth/reset-password.schema";

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
 *
 * ============================================================
 */

export function ResetPasswordForm() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  /**
   * ==========================================================
   * TOKEN
   * ==========================================================
   */

  const token =
    searchParams.get("token");

  /**
   * ==========================================================
   * TRANSITION
   * ==========================================================
   */

  const [
    isPending,
    startTransition,
  ] = useTransition();

  /**
   * ==========================================================
   * LOCAL STATE
   * ==========================================================
   */

  const [
    serverError,
    setServerError,
  ] = useState("");

  const [
    isSuccess,
    setIsSuccess,
  ] = useState(false);

  /**
   * ==========================================================
   * FORM
   * ==========================================================
   */

  const {
    register,
    handleSubmit,
    setError,

    formState: {
      errors,
    },
  } = useForm<ResetPasswordInput>({
    resolver:
      zodResolver(
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
   * INVALID TOKEN
   * ==========================================================
   */

  if (!token) {
    return (
      <AuthCard>

        {/* ====================================================
            HEADER
        ==================================================== */}

        <AuthHeader
          title="Link Tidak Valid"
          description="Link untuk mengatur ulang password tidak valid atau sudah tidak tersedia."
        />

        {/* ====================================================
            ERROR STATE
        ==================================================== */}

        <Alert
          variant="destructive"
          className="
            rounded-xl
            border-red-200
            bg-red-50
            text-red-900
          "
        >
          <AlertCircle
            className="h-4 w-4"
          />

          <AlertTitle>
            Link reset tidak valid
          </AlertTitle>

          <AlertDescription
            className="
              leading-5
            "
          >
            Silakan buat permintaan
            reset password baru untuk
            mendapatkan link yang valid.
          </AlertDescription>
        </Alert>

        {/* ====================================================
            ACTION
        ==================================================== */}

        <div
          className="
            mt-5
            flex
            justify-center
            sm:mt-6
          "
        >
          <Link
            href="/forgot-password"
            className="
              inline-flex
              min-h-11
              items-center
              gap-2
              rounded-xl
              px-3
              text-sm
              font-semibold
              text-sky-700
              transition-all
              duration-200

              hover:bg-sky-50
              hover:text-sky-800

              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-sky-500
              focus-visible:ring-offset-2

              sm:min-h-0
            "
          >
            <ArrowLeft
              className="
                h-4
                w-4
              "
            />

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
        /**
         * ====================================================
         * API REQUEST
         * ====================================================
         */

        const response =
          await fetch(
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

        /**
         * ====================================================
         * ERROR RESPONSE
         * ====================================================
         */

        if (!response.ok) {
          /**
           * ==================================================
           * SERVER FIELD ERRORS
           * ==================================================
           */

          if (result.errors) {
            for (
              const [
                field,
                messages,
              ] of Object.entries(
                result.errors
              )
            ) {
              const message =
                Array.isArray(messages)
                  ? messages[0]
                  : messages;

              if (
                typeof message !==
                "string"
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

          /**
           * ==================================================
           * SERVER MESSAGE
           * ==================================================
           */

          const message =
            result.message ??
            "Gagal mengatur ulang password.";

          setServerError(
            message
          );

          toast.error(
            message
          );

          return;
        }

        /**
         * ====================================================
         * SUCCESS
         * ====================================================
         */

        setIsSuccess(true);

        toast.success(
          result.message ??
            "Password berhasil diperbarui."
        );

        /**
         * ====================================================
         * REDIRECT
         * ====================================================
         *
         * Berikan waktu agar user
         * dapat melihat success state.
         */

        window.setTimeout(() => {
          router.replace(
            "/login"
          );
        }, 2500);
      } catch (error) {
        /**
         * ====================================================
         * CLIENT / NETWORK ERROR
         * ====================================================
         */

        console.error(
          "[RESET_PASSWORD_CLIENT_ERROR]",
          error
        );

        const message =
          "Terjadi kesalahan. Silakan coba lagi.";

        setServerError(
          message
        );

        toast.error(
          message
        );
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

        {/* ====================================================
            SUCCESS ICON
        ==================================================== */}

        <div
          className="
            mb-5
            flex
            justify-center
            sm:mb-6
          "
        >
          <div
            className="
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-emerald-50
              text-emerald-600
              ring-4
              ring-emerald-50
              sm:h-16
              sm:w-16
            "
          >
            <CheckCircle2
              className="
                h-8
                w-8
                sm:h-9
                sm:w-9
              "
            />
          </div>
        </div>

        {/* ====================================================
            HEADER
        ==================================================== */}

        <AuthHeader
          title="Password Berhasil"
          description="Password Anda berhasil diperbarui dan akun Anda sudah siap digunakan."
        />

        {/* ====================================================
            SUCCESS ALERT
        ==================================================== */}

        <Alert
          className="
            rounded-xl
            border-emerald-200
            bg-emerald-50
            text-emerald-900
          "
        >
          <CheckCircle2
            className="
              h-4
              w-4
              text-emerald-600
            "
          />

          <AlertTitle>
            Berhasil
          </AlertTitle>

          <AlertDescription
            className="
              leading-5
              text-emerald-800
            "
          >
            Anda akan diarahkan ke
            halaman login dalam
            beberapa detik.
          </AlertDescription>
        </Alert>

        {/* ====================================================
            LOGIN ACTION
        ==================================================== */}

        <div
          className="
            mt-5
            flex
            justify-center
            sm:mt-6
          "
        >
          <Link
            href="/login"
            className="
              inline-flex
              min-h-11
              items-center
              gap-2
              rounded-xl
              bg-sky-700
              px-5
              text-sm
              font-semibold
              text-white
              shadow-md
              shadow-sky-700/15
              transition-all
              duration-200

              hover:bg-sky-800
              hover:shadow-lg
              hover:shadow-sky-700/20

              active:scale-[0.99]

              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-sky-500
              focus-visible:ring-offset-2

              sm:min-h-0
            "
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

      {/* ======================================================
          HEADER ICON
      ====================================================== */}

      <div
        className="
          mb-5
          flex
          justify-center
          sm:mb-6
        "
      >
        <div
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            bg-sky-700
            text-white
            shadow-lg
            shadow-sky-700/20
            ring-4
            ring-sky-50
            transition-transform
            duration-300
            hover:scale-105
            sm:h-16
            sm:w-16
          "
        >
          <KeyRound
            className="
              h-7
              w-7
              sm:h-8
              sm:w-8
            "
          />
        </div>
      </div>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <AuthHeader
        title="Reset Password"
        description="Masukkan password baru untuk mengamankan akun Anda."
      />

      {/* ======================================================
          FORM
      ====================================================== */}

      <form
        onSubmit={
          handleSubmit(
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
            PASSWORD
        ==================================================== */}

        <PasswordField
          id="password"
          label="Password Baru"
          placeholder="Masukkan password baru"
          autoComplete="new-password"
          disabled={isPending}
          required
          error={
            errors.password
              ?.message
          }
          {...register(
            "password"
          )}
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
          required
          error={
            errors
              .confirmPassword
              ?.message
          }
          {...register(
            "confirmPassword"
          )}
        />

        {/* ====================================================
            PASSWORD SECURITY INFO
        ==================================================== */}

        <div
          className="
            rounded-xl
            border
            border-sky-100
            bg-sky-50
            px-3.5
            py-3
            text-xs
            leading-5
            text-sky-800
          "
        >
          <p>
            Gunakan password yang kuat
            dan jangan gunakan password
            yang sama dengan akun lain.
          </p>
        </div>

        {/* ====================================================
            SERVER ERROR
        ==================================================== */}

        {serverError && (
          <Alert
            variant="destructive"
            className="
              rounded-xl
              border-red-200
              bg-red-50
              text-red-900
            "
          >
            <AlertCircle
              className="h-4 w-4"
            />

            <AlertTitle>
              Reset Password Gagal
            </AlertTitle>

            <AlertDescription
              className="
                leading-5
              "
            >
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
          loadingText="Memproses..."
          className="
            bg-sky-700
            hover:bg-sky-800
            shadow-md
            shadow-sky-700/15
            hover:shadow-lg
            hover:shadow-sky-700/20
          "
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
          Ingat password Anda?
        </span>{" "}

        <Link
          href="/login"
          className="
            inline-flex
            min-h-11
            items-center
            gap-1.5
            font-semibold
            text-sky-700
            transition-colors
            duration-200

            hover:text-sky-800
            hover:underline

            focus:outline-none
            focus-visible:rounded-md
            focus-visible:ring-2
            focus-visible:ring-sky-500
            focus-visible:ring-offset-2

            sm:min-h-0
          "
        >
          <ArrowLeft
            className="
              h-4
              w-4
            "
          />

          Kembali ke Login
        </Link>
      </div>

    </AuthCard>
  );
}