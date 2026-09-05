"use client";

import {
  useState,
  useTransition,
} from "react";

import Link from "next/link";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

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
  login,
} from "@/actions/auth/login";

import {
  LoginSchema,
  type LoginInput,
} from "@/validations/auth/login.schema";

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

import {
  Checkbox,
} from "@/components/ui/checkbox";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

/**
 * ============================================================
 * LOGIN FORM
 * ============================================================
 *
 * Catatan:
 * - Logic authentication dipertahankan.
 * - Callback URL tetap divalidasi sebelum redirect.
 * - EMAIL_NOT_VERIFIED tetap diarahkan ke /verify-email.
 * - Field errors dari server tetap dipasang ke react-hook-form.
 * - Perubahan pada file ini fokus pada UX mobile + Pisjo theme.
 */

export function LoginForm() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  /**
   * ==========================================================
   * SAFE CALLBACK URL
   * ==========================================================
   */

  const rawCallbackUrl =
    searchParams.get(
      "callbackUrl"
    );

  const callbackUrl =
    rawCallbackUrl &&
    rawCallbackUrl.startsWith("/") &&
    !rawCallbackUrl.startsWith("//")
      ? rawCallbackUrl
      : "/";

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
    rememberMe,
    setRememberMe,
  ] = useState(false);

  const [
    serverError,
    setServerError,
  ] = useState("");

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
  } = useForm<LoginInput>({
    resolver:
      zodResolver(
        LoginSchema
      ),

    defaultValues: {
      email: "",
      password: "",
    },

    mode: "onSubmit",
  });

  /**
   * ==========================================================
   * HANDLE LOGIN
   * ==========================================================
   */

  const onSubmit = (
    values: LoginInput
  ) => {
    setServerError("");

    startTransition(
      async () => {
        try {
          const result =
            await login(values);

          /**
           * ==================================================
           * LOGIN FAILED
           * ==================================================
           */

          if (!result.success) {
            /**
             * ================================================
             * EMAIL NOT VERIFIED
             * ================================================
             */

            if (
              result.code ===
              "EMAIL_NOT_VERIFIED"
            ) {
              toast.error(
                result.message ??
                  "Email Anda belum diverifikasi."
              );

              router.push(
                `/verify-email?email=${encodeURIComponent(
                  values.email
                    .trim()
                    .toLowerCase()
                )}`
              );

              return;
            }

            /**
             * ================================================
             * FIELD ERRORS
             * ================================================
             */

            if (
              result.fieldErrors
            ) {
              for (
                const [
                  field,
                  message,
                ] of Object.entries(
                  result.fieldErrors
                )
              ) {
                if (!message) {
                  continue;
                }

                setError(
                  field as keyof LoginInput,
                  {
                    type: "server",
                    message,
                  }
                );
              }
            }

            /**
             * ================================================
             * SERVER ERROR
             * ================================================
             */

            const message =
              result.message ??
              "Login gagal. Silakan periksa kembali data Anda.";

            setServerError(
              message
            );

            toast.error(
              message
            );

            return;
          }

          /**
           * ==================================================
           * LOGIN SUCCESS
           * ==================================================
           */

          toast.success(
            result.message ??
              "Login berhasil."
          );

          /**
           * ==================================================
           * REDIRECT
           * ==================================================
           */

          router.replace(
            callbackUrl
          );

          router.refresh();
        } catch (error) {
          console.error(
            "[LOGIN_FORM_ERROR]",
            error
          );

          const message =
            "Terjadi kesalahan saat login. Silakan coba lagi.";

          setServerError(
            message
          );

          toast.error(
            message
          );
        }
      }
    );
  };

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <AuthCard>
      <AuthHeader
        title="Masuk"
        description="Masuk ke akun Anda untuk melanjutkan."
      />

      <form
        onSubmit={handleSubmit(
          onSubmit
        )}
        className="
          space-y-5
          sm:space-y-6
        "
        noValidate
      >
        {/* ====================================================
            EMAIL
        ==================================================== */}

        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="
              text-sm
              font-medium
              text-[var(--pisjo-navy)]
            "
          >
            Email
          </Label>

          <Input
            id="email"
            type="email"
            placeholder="nama@email.com"
            autoComplete="email"
            inputMode="email"
            aria-invalid={
              !!errors.email
            }
            aria-describedby={
              errors.email
                ? "email-error"
                : undefined
            }
            disabled={isPending}
            {...register("email")}
            className={`
              h-12
              w-full
              rounded-xl
              border-slate-200
              bg-white
              px-4
              text-base
              shadow-sm
              transition-all
              duration-200
              placeholder:text-slate-400
              focus:border-[var(--pisjo-primary)]
              focus:ring-2
              focus:ring-[rgba(7,136,232,0.18)]
              disabled:cursor-not-allowed
              disabled:opacity-60
              sm:text-sm
              ${
                errors.email
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                  : ""
              }
            `}
          />

          {errors.email ? (
            <p
              id="email-error"
              role="alert"
              className="
                flex
                items-start
                gap-1.5
                text-sm
                leading-5
                text-red-600
              "
            >
              <AlertCircle
                aria-hidden="true"
                className="
                  mt-0.5
                  h-4
                  w-4
                  shrink-0
                "
              />

              <span>
                {errors.email.message}
              </span>
            </p>
          ) : null}
        </div>

        {/* ====================================================
            PASSWORD
        ==================================================== */}

        <PasswordField
          id="password"
          label="Password"
          placeholder="Masukkan password"
          autoComplete="current-password"
          disabled={isPending}
          error={
            errors.password?.message
          }
          {...register("password")}
        />

        {/* ====================================================
            REMEMBER ME + FORGOT PASSWORD
        ==================================================== */}

        <div
          className="
            flex
            flex-col
            gap-1
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:gap-3
          "
        >
          {/* REMEMBER ME */}

          <div
            className="
              flex
              min-h-11
              items-center
            "
          >
            <div
              className="
                flex
                items-center
                gap-2.5
              "
            >
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                disabled={isPending}
                onCheckedChange={(
                  checked
                ) => {
                  setRememberMe(
                    Boolean(checked)
                  );
                }}
                className="
                  h-5
                  w-5
                  rounded-md
                  border-slate-300
                  data-[state=checked]:border-[var(--pisjo-primary)]
                  data-[state=checked]:bg-[var(--pisjo-primary)]
                  data-[state=checked]:text-white
                  focus-visible:ring-2
                  focus-visible:ring-[var(--pisjo-primary)]
                  focus-visible:ring-offset-2
                "
              />

              <Label
                htmlFor="rememberMe"
                className="
                  cursor-pointer
                  select-none
                  text-sm
                  font-medium
                  text-slate-600
                "
              >
                Ingat saya
              </Label>
            </div>
          </div>

          {/* FORGOT PASSWORD */}

          <Link
            href="/forgot-password"
            tabIndex={
              isPending
                ? -1
                : undefined
            }
            className="
              inline-flex
              min-h-11
              w-fit
              items-center
              rounded-md
              px-1
              text-sm
              font-semibold
              text-[var(--pisjo-ocean)]
              transition-colors
              duration-200
              hover:text-[var(--pisjo-primary)]
              hover:underline
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-[var(--pisjo-primary)]
              focus-visible:ring-offset-2
              sm:min-h-0
            "
          >
            Lupa password?
          </Link>
        </div>

        {/* ====================================================
            SERVER ERROR
        ==================================================== */}

        {serverError ? (
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
              aria-hidden="true"
              className="h-4 w-4"
            />

            <AlertTitle>
              Login gagal
            </AlertTitle>

            <AlertDescription
              className="
                leading-5
              "
            >
              {serverError}
            </AlertDescription>
          </Alert>
        ) : null}

        {/* ====================================================
            LOGIN BUTTON
        ==================================================== */}

        <SubmitButton
          loading={isPending}
          text="Masuk"
          loadingText="Memproses..."
        />
      </form>

      {/* ======================================================
          SECURITY INFORMATION
      ====================================================== */}

      <div
        className="
          mt-5
          flex
          items-center
          justify-center
          gap-2
          text-center
          text-xs
          leading-5
          text-slate-400
        "
      >
        <ShieldCheck
          aria-hidden="true"
          className="
            h-4
            w-4
            shrink-0
          "
        />

        <span>
          Login Anda aman dan terenkripsi.
        </span>
      </div>

      {/* ======================================================
          DIVIDER
      ====================================================== */}

      <div
        className="
          my-6
          flex
          items-center
          gap-3
        "
      >
        <div
          className="
            h-px
            flex-1
            bg-slate-200
          "
        />

        <span
          className="
            shrink-0
            text-xs
            font-medium
            uppercase
            tracking-wider
            text-slate-400
          "
        >
          atau
        </span>

        <div
          className="
            h-px
            flex-1
            bg-slate-200
          "
        />
      </div>

      {/* ======================================================
          REGISTER LINK
      ====================================================== */}

      <div
        className="
          text-center
          text-sm
          text-muted-foreground
        "
      >
        <span>
          Belum punya akun?
        </span>{" "}

        <Link
          href="/register"
          className="
            inline-flex
            min-h-11
            items-center
            gap-1
            rounded-md
            px-1
            font-semibold
            text-[var(--pisjo-ocean)]
            transition-colors
            duration-200
            hover:text-[var(--pisjo-primary)]
            hover:underline
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-[var(--pisjo-primary)]
            focus-visible:ring-offset-2
            sm:min-h-0
          "
        >
          Daftar sekarang

          <ArrowRight
            aria-hidden="true"
            className="
              h-4
              w-4
              transition-transform
              duration-200
            "
          />
        </Link>
      </div>
    </AuthCard>
  );
}
