"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Nilai progress (0 - 100)
   */
  value?: number;

  /**
   * Tinggi progress bar
   * Default: h-2
   */
  size?: "sm" | "md" | "lg";

  /**
   * Menampilkan animasi stripes saat loading
   */
  animated?: boolean;
}

export function Progress({
  value = 0,
  size = "md",
  animated = false,
  className,
  ...props
}: ProgressProps) {
  const progress = Math.min(
    100,
    Math.max(0, value)
  );

  const height = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  }[size];

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-muted",
        height,
        className
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-[width] duration-300 ease-out",
          animated &&
            "bg-[length:1rem_1rem] bg-[linear-gradient(-45deg,rgba(255,255,255,.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.2)_50%,rgba(255,255,255,.2)_75%,transparent_75%,transparent)] animate-pulse"
        )}
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
}

export default Progress;