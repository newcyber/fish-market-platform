"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  const generatedId = useId();

  const inputId = id ?? generatedId;

  const helperId = `${inputId}-helper`;

  const errorId = `${inputId}-error`;

  const [showPassword, setShowPassword] =
    useState(false);

  return (
    <div className={cn("space-y-2", containerClassName)}>
      <Label
        htmlFor={inputId}
        className={labelClassName}
      >
        {label}

        {required && (
          <span className="ml-1 text-destructive">
            *
          </span>
        )}
      </Label>

      <div className="relative">
        <Input
          id={inputId}
          type={
            showPassword ? "text" : "password"
          }
          className={cn("pr-11", className)}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? errorId
              : helperText
                ? helperId
                : undefined
          }
          {...props}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          tabIndex={-1}
          disabled={props.disabled}
          onClick={() =>
            setShowPassword((prev) => !prev)
          }
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
          aria-label={
            showPassword
              ? "Hide password"
              : "Show password"
          }
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>

      {error ? (
        <p
          id={errorId}
          className={cn(
            "text-sm text-destructive",
            helperClassName
          )}
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          id={helperId}
          className={cn(
            "text-sm text-muted-foreground",
            helperClassName
          )}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}