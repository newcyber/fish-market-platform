"use client";

import { useState, useTransition } from "react";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

import { toggleWishlistAction } from "@/actions/wishlist/toggle-wishlist";

interface ToggleWishlistButtonProps {
  productId: string;
  initialInWishlist?: boolean;
  className?: string;
}

export default function ToggleWishlistButton({
  productId,
  initialInWishlist = false,
  className = "",
}: ToggleWishlistButtonProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [isInWishlist, setIsInWishlist] =
    useState(initialInWishlist);

  const [message, setMessage] =
    useState<string | null>(null);

  function handleToggle() {
    if (isPending) {
      return;
    }

    setMessage(null);

    startTransition(() => {
      void (async () => {
        const result =
          await toggleWishlistAction(productId);

        if (!result.success) {
          setMessage(
            result.message ??
              "Gagal memperbarui wishlist."
          );

          return;
        }

        setIsInWishlist(
          result.action === "added"
        );

        router.refresh();
      })();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-label={
          isInWishlist
            ? "Hapus dari wishlist"
            : "Tambahkan ke wishlist"
        }
        aria-pressed={isInWishlist}
        className={[
          "inline-flex items-center justify-center rounded-xl border transition",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isInWishlist
            ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-red-500",
          className,
        ].join(" ")}
      >
        <Heart
          className={[
            "h-5 w-5 transition",
            isInWishlist ? "fill-current" : "",
            isPending ? "animate-pulse" : "",
          ].join(" ")}
        />
      </button>

      {message && (
        <p className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 shadow-sm">
          {message}
        </p>
      )}
    </div>
  );
}