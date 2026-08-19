"use client";

import {
  useState,
  useTransition,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";

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

/**
 * ============================================================
 * LOGIN FORM
 * ============================================================
 */

export function LoginForm() {
  const router = useRouter();

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    rememberMe,
    setRememberMe,
  ] = useState(false);

  const [
    serverError,
    setServerError,
  ] = useState("");

  const {
    register,
    handleSubmit,
    setError,

    formState: {
      errors,
    },
  } = useForm<LoginInput>({
    resolver:
      zodResolver(LoginSchema),

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

    startTransition(async () => {
      const result =
        await login(values);

      if (!result.success) {
        /**
         * ====================================================
         * EMAIL NOT VERIFIED
         * ====================================================
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
         * ====================================================
         * FIELD ERRORS
         * ====================================================
         */

        if (result.fieldErrors) {
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

        setServerError(
          result.message ?? ""
        );

        toast.error(
          result.message ??
            "Login gagal."
        );

        return;
      }

      /**
       * ======================================================
       * LOGIN SUCCESS
       * ======================================================
       */

      toast.success(
        result.message ??
          "Login berhasil."
      );

      /**
       * Middleware menentukan
       * tujuan berdasarkan role.
       */

      router.replace("/");

      router.refresh();
    });
  };

  return (
    <AuthCard>

      <AuthHeader
        title="Masuk"
        description="Masuk ke akun Anda untuk melanjutkan."
      />

      <form
        onSubmit={
          handleSubmit(onSubmit)
        }
        className="space-y-6"
        noValidate
      >

        {/* ==================================================== */}
        {/* EMAIL */}
        {/* ==================================================== */}

        <div className="space-y-2">

          <Label htmlFor="email">
            Email
          </Label>

          <Input
            id="email"
            type="email"
            placeholder="nama@email.com"
            autoComplete="email"
            aria-invalid={
              !!errors.email
            }
            disabled={isPending}
            {...register("email")}
          />

          {errors.email && (
            <p className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}

        </div>

        {/* ==================================================== */}
        {/* PASSWORD */}
        {/* ==================================================== */}

        <PasswordField
          label="Password"
          placeholder="Masukkan password"
          autoComplete="current-password"
          disabled={isPending}
          error={
            errors.password?.message
          }
          {...register("password")}
        />

        {/* ==================================================== */}
        {/* REMEMBER ME */}
        {/* ==================================================== */}

        <div className="flex items-center justify-between gap-4">

          <div className="flex items-center gap-2">

            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(
                checked
              ) =>
                setRememberMe(
                  Boolean(checked)
                )
              }
            />

            <Label
              htmlFor="rememberMe"
              className="cursor-pointer select-none"
            >
              Ingat saya
            </Label>

          </div>

          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary transition hover:underline"
          >
            Lupa password?
          </Link>

        </div>

        {/* ==================================================== */}
        {/* SERVER ERROR */}
        {/* ==================================================== */}

        {serverError && (
          <Alert variant="destructive">

            <AlertTitle>
              Login gagal
            </AlertTitle>

            <AlertDescription>
              {serverError}
            </AlertDescription>

          </Alert>
        )}

        {/* ==================================================== */}
        {/* LOGIN BUTTON */}
        {/* ==================================================== */}

        <SubmitButton
          loading={isPending}
          text="Masuk"
          loadingText="Memproses..."
          className="h-11 bg-sky-700 hover:bg-sky-800"
        />

      </form>

      {/* ====================================================== */}
      {/* REGISTER LINK */}
      {/* ====================================================== */}

      <div className="mt-6 text-center text-sm text-muted-foreground">

        Belum punya akun?{" "}

        <Link
          href="/register"
          className="font-semibold text-sky-700 transition hover:text-sky-800 hover:underline"
        >
          Daftar sekarang
        </Link>

      </div>

    </AuthCard>
  );
}