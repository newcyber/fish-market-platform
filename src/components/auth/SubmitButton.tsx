"use client";

import type { ButtonHTMLAttributes } from "react";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SubmitButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "type"
  > {
  loading?: boolean;
  text: string;
  loadingText?: string;
}

export function SubmitButton({
  loading = false,
  text,
  loadingText = "Memproses...",
  disabled,
  className,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      {...props}
      type="submit"
      disabled={loading || disabled}
      className={`
        h-12
        w-full
        rounded-xl
        bg-[var(--pisjo-primary)]
        px-5
        text-sm
        font-semibold
        text-white
        shadow-md
        shadow-[rgba(7,136,232,0.18)]
        transition-all
        duration-200
        hover:bg-[var(--pisjo-ocean)]
        hover:shadow-lg
        hover:shadow-[rgba(7,136,232,0.22)]
        active:scale-[0.99]
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[var(--pisjo-primary)]
        focus-visible:ring-offset-2
        disabled:cursor-not-allowed
        disabled:opacity-60
        ${className ?? ""}
      `}
    >
      {loading ? (
        <>
          <Loader2
            aria-hidden="true"
            className="
              mr-2
              h-4
              w-4
              animate-spin
            "
          />

          <span>
            {loadingText}
          </span>
        </>
      ) : (
        text
      )}
    </Button>
  );
}
