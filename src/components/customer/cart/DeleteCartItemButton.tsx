"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { deleteCartItemAction } from "@/actions/cart/delete-cart-item";

interface DeleteCartItemButtonProps {
  cartItemId: string;
}

export default function DeleteCartItemButton({
  cartItemId,
}: DeleteCartItemButtonProps) {
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  const [message, setMessage] =
    useState<string | null>(null);

  function handleDelete() {
    const confirmed = window.confirm(
      "Hapus produk ini dari keranjang?"
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);

    startTransition(() => {
      void (async () => {
        const result =
          await deleteCartItemAction(
            cartItemId
          );

        if (!result.success) {
          setMessage(
            result.message ??
              "Gagal menghapus produk dari keranjang."
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
        onClick={handleDelete}
        disabled={isPending}
        aria-label="Hapus produk"
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
        <Trash2 className="h-4 w-4" />
      </button>

      {message && (
        <p className="max-w-[220px] text-right text-xs text-red-500">
          {message}
        </p>
      )}
    </div>
  );
}