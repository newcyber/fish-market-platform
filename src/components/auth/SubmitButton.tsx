"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

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
  return (
    <Button
      type="submit"
      disabled={loading || disabled}
      className={[
        "w-full",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />

          {loadingText}
        </>
      ) : (
        text
      )}
    </Button>
  );
}