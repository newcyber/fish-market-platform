"use client";

import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
} from "react";

import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordFieldProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type"
  > {
  label: string;
  error?: string;
  helperText?: string;
}

export const PasswordField = forwardRef<
  HTMLInputElement,
  PasswordFieldProps
>(function PasswordField(
  {
    id,
    label,
    error,
    helperText,
    className,
    ...inputProps
  },
  ref
) {
  const generatedId = useId();

  const inputId = id ?? `password-${generatedId}`;

  const [showPassword, setShowPassword] =
    useState(false);

  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const describedBy = error
    ? errorId
    : helperText
      ? helperId
      : undefined;

  return (
    <div className="space-y-2">
      <Label
        htmlFor={inputId}
        className="
          text-sm
          font-medium
          text-[var(--pisjo-navy)]
        "
      >
        {label}
      </Label>

      <div className="relative">
        <Input
          {...inputProps}
          ref={ref}
          id={inputId}
          type={
            showPassword
              ? "text"
              : "password"
          }
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`
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
            focus:border-[var(--pisjo-primary)]
            focus:ring-2
            focus:ring-[rgba(7,136,232,0.18)]
            disabled:cursor-not-allowed
            disabled:opacity-60
            sm:text-sm
            ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                : ""
            }
            ${className ?? ""}
          `}
        />

        <button
          type="button"
          tabIndex={inputProps.disabled ? -1 : 0}
          disabled={inputProps.disabled}
          onClick={() => {
            setShowPassword(
              (current) => !current
            );
          }}
          aria-label={
            showPassword
              ? "Sembunyikan password"
              : "Tampilkan password"
          }
          aria-pressed={showPassword}
          className="
            absolute
            right-1
            top-1/2
            flex
            h-10
            w-10
            -translate-y-1/2
            items-center
            justify-center
            rounded-lg
            text-slate-500
            transition-colors
            hover:bg-[var(--pisjo-soft-blue)]
            hover:text-[var(--pisjo-ocean)]
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-[var(--pisjo-primary)]
            focus-visible:ring-offset-1
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {showPassword ? (
            <EyeOff
              aria-hidden="true"
              className="h-5 w-5"
            />
          ) : (
            <Eye
              aria-hidden="true"
              className="h-5 w-5"
            />
          )}
        </button>
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="
            text-sm
            leading-5
            text-red-600
          "
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          id={helperId}
          className="
            text-xs
            leading-5
            text-[var(--pisjo-text-secondary)]
          "
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
