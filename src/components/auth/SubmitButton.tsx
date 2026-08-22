"use client";

import {
  Loader2,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

/**
 * ============================================================
 * SUBMIT BUTTON
 * ============================================================
 *
 * Shared submit button untuk authentication forms.
 *
 * Features:
 * - Responsive
 * - Mobile friendly
 * - Touch friendly
 * - Loading state
 * - Accessible disabled state
 * - Keyboard focus state
 * - Prevent accidental double submit
 *
 * ============================================================
 */

interface SubmitButtonProps {
  loading?: boolean;

  disabled?: boolean;

  text: string;

  loadingText?: string;

  className?: string;
}

export function SubmitButton({
  loading = false,
  disabled = false,
  text,
  loadingText = "Loading...",
  className,
}: SubmitButtonProps) {
  /**
   * ==========================================================
   * BUTTON DISABLED STATE
   * ==========================================================
   */

  const isDisabled =
    loading || disabled;

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <Button
      type="submit"
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={[
        `
          flex
          h-12
          w-full
          items-center
          justify-center
          gap-2
          rounded-xl
          px-5
          text-sm
          font-semibold
          transition-all
          duration-200

          active:scale-[0.99]

          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-sky-500
          focus-visible:ring-offset-2

          disabled:cursor-not-allowed
          disabled:opacity-60
          disabled:active:scale-100

          sm:h-12
        `,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? (
        <>
          <Loader2
            className="
              h-4
              w-4
              shrink-0
              animate-spin
            "
            aria-hidden="true"
          />

          <span>
            {loadingText}
          </span>
        </>
      ) : (
        <span>
          {text}
        </span>
      )}
    </Button>
  );
}