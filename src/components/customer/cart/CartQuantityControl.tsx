"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  Minus,
  Plus,
  Loader2,
} from "lucide-react";

import { updateCartItemAction } from "@/actions/cart/update-cart-item";

interface CartQuantityControlProps {
  cartItemId: string;
  initialQuantity: number;
  maxQuantity: number;
}

export default function CartQuantityControl({
  cartItemId,
  initialQuantity,
  maxQuantity,
}: CartQuantityControlProps) {
  const [
    quantity,
    setQuantity,
  ] = useState(
    initialQuantity
  );

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    message,
    setMessage,
  ] = useState<
    string | null
  >(null);

  function updateQuantity(
    newQuantity: number
  ) {
    /**
     * Jangan kurang dari 1.
     */
    if (
      newQuantity < 1
    ) {
      return;
    }

    /**
     * Jangan melebihi stock.
     */
    if (
      newQuantity > maxQuantity
    ) {
      setMessage(
        `Stok maksimal tersedia ${maxQuantity}.`
      );

      return;
    }

    const previousQuantity =
      quantity;

    /**
     * Optimistic UI.
     *
     * Quantity langsung berubah
     * sebelum database selesai update.
     */
    setQuantity(
      newQuantity
    );

    setMessage(null);

    startTransition(
      async () => {
        const result =
          await updateCartItemAction(
            cartItemId,
            newQuantity
          );

        if (!result.success) {
          /**
           * Kembalikan quantity lama
           * jika update gagal.
           */
          setQuantity(
            previousQuantity
          );

          setMessage(
            result.message ??
              "Gagal memperbarui jumlah."
          );

          return;
        }

        setMessage(
          result.message ??
            null
        );
      }
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex h-10 items-center rounded-full border border-slate-200 bg-white p-1">
        <button
          type="button"
          onClick={() =>
            updateQuantity(
              quantity - 1
            )
          }
          disabled={
            isPending ||
            quantity <= 1
          }
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Kurangi jumlah"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="flex w-10 items-center justify-center">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
          ) : (
            <span className="text-sm font-semibold text-slate-900">
              {quantity}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            updateQuantity(
              quantity + 1
            )
          }
          disabled={
            isPending ||
            quantity >= maxQuantity
          }
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Tambah jumlah"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {message && (
        <p className="max-w-[220px] text-right text-xs text-slate-500">
          {message}
        </p>
      )}
    </div>
  );
}