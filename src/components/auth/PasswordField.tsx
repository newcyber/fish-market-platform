"use client";

import {
  useId,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  cn,
} from "@/lib/utils";

/**
 * ============================================================
 * PASSWORD FIELD
 * ============================================================
 *
 * Shared password input component.
 *
 * Used by:
 * - Login
 * - Register
 * - Reset Password
 *
 * Features:
 * - Show / hide password
 * - Mobile friendly
 * - Keyboard accessible
 * - Touch friendly
 * - Error state
 * - Helper text
 * - Accessible labels
 * - Responsive sizing
 *
 * ============================================================
 */

interface PasswordFieldProps
  extends Omit<
    React.ComponentProps<typeof Input>,
    "type"
  > {
  label?: string;

  helperText?: string;

  error?: string;

  required?: boolean;

  containerClassName?: string;

  labelClassName?: string;

  helperClassName?: string;
}

export function PasswordField({
  id,
  label = "Password",
  helperText,
  error,
  required = false,
  className,
  containerClassName,
  labelClassName,
  helperClassName,
  ...props
}: PasswordFieldProps) {
  /**
   * ==========================================================
   * IDS
   * ==========================================================
   */

  const generatedId =
    useId();

  const inputId =
    id ?? generatedId;

  const helperId =
    `${inputId}-helper`;

  const errorId =
    `${inputId}-error`;

  /**
   * ==========================================================
   * PASSWORD VISIBILITY
   * ==========================================================
   */

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div
      className={cn(
        "space-y-2",
        containerClassName
      )}
    >

      {/* ======================================================
          LABEL
      ====================================================== */}

      <Label
        htmlFor={inputId}
        className={cn(
          `
            text-sm
            font-medium
            text-slate-800
          `,
          labelClassName
        )}
      >
        {label}

        {required && (
          <span
            aria-hidden="true"
            className="
              ml-1
              text-destructive
            "
          >
            *
          </span>
        )}
      </Label>

      {/* ======================================================
          INPUT WRAPPER
      ====================================================== */}

      <div
        className="
          relative
          w-full
        "
      >

        {/* ====================================================
            PASSWORD INPUT
        ==================================================== */}

        <Input
          id={inputId}
          type={
            showPassword
              ? "text"
              : "password"
          }

          required={required}

          aria-invalid={
            !!error
          }

          aria-describedby={
            error
              ? errorId
              : helperText
                ? helperId
                : undefined
          }

          className={cn(
            `
              h-12
              w-full
              rounded-xl
              border-slate-200
              bg-white
              px-4
              pr-14
              text-base
              shadow-sm
              transition-all
              duration-200

              placeholder:text-slate-400

              focus:border-sky-500
              focus:ring-2
              focus:ring-sky-500/20

              disabled:cursor-not-allowed
              disabled:opacity-60

              aria-[invalid=true]:border-red-300
              aria-[invalid=true]:focus:border-red-500
              aria-[invalid=true]:focus:ring-red-500/20

              sm:text-sm
            `,
            className
          )}

          {...props}
        />

        {/* ====================================================
            SHOW / HIDE PASSWORD
        ==================================================== */}

        <Button
          type="button"
          variant="ghost"
          size="icon"

          disabled={
            props.disabled
          }

          onClick={() =>
            setShowPassword(
              (previous) =>
                !previous
            )
          }

          className="
            absolute
            right-1
            top-1/2
            h-10
            w-10
            -translate-y-1/2
            rounded-lg
            text-slate-500
            transition-all
            duration-200

            hover:bg-slate-100
            hover:text-slate-700

            active:scale-95

            focus-visible:bg-slate-100
            focus-visible:text-slate-700
            focus-visible:ring-2
            focus-visible:ring-sky-500
            focus-visible:ring-offset-1

            disabled:cursor-not-allowed
            disabled:opacity-50

            sm:h-10
            sm:w-10
          "

          aria-label={
            showPassword
              ? "Sembunyikan password"
              : "Tampilkan password"
          }

          aria-pressed={
            showPassword
          }

          title={
            showPassword
              ? "Sembunyikan password"
              : "Tampilkan password"
          }
        >
          {showPassword ? (
            <EyeOff
              className="
                h-5
                w-5
              "
              aria-hidden="true"
            />
          ) : (
            <Eye
              className="
                h-5
                w-5
              "
              aria-hidden="true"
            />
          )}
        </Button>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error ? (
        <p
          id={errorId}
          role="alert"
          className={cn(
            `
              flex
              items-start
              gap-1.5
              text-sm
              leading-5
              text-destructive
            `,
            helperClassName
          )}
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
            {error}
          </span>
        </p>
      ) : helperText ? (

        /* ====================================================
           HELPER TEXT
        ==================================================== */

        <p
          id={helperId}
          className={cn(
            `
              text-sm
              leading-5
              text-muted-foreground
            `,
            helperClassName
          )}
        >
          {helperText}
        </p>

      ) : null}

    </div>
  );
}