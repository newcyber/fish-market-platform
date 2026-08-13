"use client";

import {
  useState,
  useTransition,
} from "react";

import { HeartOff } from "lucide-react";
import { useRouter } from "next/navigation";

import { removeFromWishlistAction } from "@/actions/wishlist/remove-from-wishlist";

interface RemoveWishlistButtonProps {
  productId: string;
}

export default function RemoveWishlistButton({
  productId,
}: RemoveWishlistButtonProps) {
  const router = useRouter();

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    message,
    setMessage,
  ] = useState<string | null>(null);

  function handleRemove() {
    const confirmed = window.confirm(
      "Hapus produk ini dari wishlist?"
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);

    startTransition(() => {
      void (async () => {
        const result =
          await removeFromWishlistAction(
            productId
          );

        if (!result.success) {
          setMessage(
            result.message ??
              "Gagal menghapus produk dari wishlist."
          );

          return;
        }

        router.refresh();
      })();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        aria-label="Hapus dari wishlist"
        className="
          inline-flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          border
          border-red-100
          text-red-500
          transition
          hover:bg-red-50
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        <HeartOff className="h-4 w-4" />
      </button>

      {message && (
        <p className="max-w-55 text-right text-xs text-red-500">
          {message}
        </p>
      )}
    </div>
  );
}