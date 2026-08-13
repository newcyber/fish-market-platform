"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  Check,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";

import { addToCartAction } from "@/actions/cart/add-to-cart";

interface AddToCartButtonProps {
  productId: string;
  stock: number;
}

export default function AddToCartButton({
  productId,
  stock,
}: AddToCartButtonProps) {
  const [
    quantity,
    setQuantity,
  ] = useState(1);

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    message,
    setMessage,
  ] = useState<string | null>(
    null
  );

  const [
    success,
    setSuccess,
  ] = useState(false);

  const outOfStock =
    stock <= 0;

  /**
   * ============================================================
   * DECREASE
   * ============================================================
   */

  function decrease() {
    setQuantity((current) =>
      Math.max(1, current - 1)
    );

    setSuccess(false);
    setMessage(null);
  }

  /**
   * ============================================================
   * INCREASE
   * ============================================================
   */

  function increase() {
    setQuantity((current) =>
      Math.min(stock, current + 1)
    );

    setSuccess(false);
    setMessage(null);
  }

  /**
   * ============================================================
   * ADD TO CART
   * ============================================================
   */

  function handleAddToCart() {
    if (outOfStock) {
      return;
    }

    if (quantity < 1) {
      return;
    }

    if (quantity > stock) {
      setSuccess(false);

      setMessage(
        `Jumlah maksimal ${stock}.`
      );

      return;
    }

    setSuccess(false);
    setMessage(null);

    startTransition(
  async () => {
    const result =
      await addToCartAction(
        productId,
        quantity
      );

    if (!result.success) {
      setSuccess(false);

      setMessage(
        result.message ??
          "Gagal menambahkan produk ke keranjang."
      );

      return;
    }

    setSuccess(true);

    setMessage(
      result.message ??
        "Produk berhasil ditambahkan ke keranjang."
    );
  }
);
  }

  /**
   * ============================================================
   * UI
   * ============================================================
   */

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* ================================================== */}
        {/* QUANTITY */}
        {/* ================================================== */}

        <div
          className={[
            "flex h-12 items-center justify-between rounded-full border bg-white px-2 sm:w-36",
            outOfStock
              ? "border-slate-200 opacity-60"
              : "border-slate-200",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={decrease}
            disabled={
              outOfStock ||
              isPending ||
              quantity <= 1
            }
            aria-label="Kurangi jumlah"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>

          <span className="min-w-8 text-center text-sm font-semibold text-slate-900">
            {quantity}
          </span>

          <button
            type="button"
            onClick={increase}
            disabled={
              outOfStock ||
              isPending ||
              quantity >= stock
            }
            aria-label="Tambah jumlah"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* ================================================== */}
        {/* ADD BUTTON */}
        {/* ================================================== */}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={
            outOfStock ||
            isPending
          }
          className={[
            "flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition",
            outOfStock
              ? "cursor-not-allowed bg-slate-200 text-slate-400"
              : isPending
                ? "cursor-wait bg-slate-700 text-white"
                : success
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-cyan-600 text-white hover:bg-cyan-700",
          ].join(" ")}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />

              Menambahkan...
            </>
          ) : success ? (
            <>
              <Check className="h-4 w-4" />

              Berhasil Ditambahkan
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />

              {outOfStock
                ? "Stok Habis"
                : "Tambah ke Keranjang"}
            </>
          )}
        </button>
      </div>

      {/* ====================================================== */}
      {/* RESULT MESSAGE */}
      {/* ====================================================== */}

      {message && (
        <div
          className={[
            "mt-3 rounded-xl px-4 py-3 text-center text-xs font-medium",
            success
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700",
          ].join(" ")}
        >
          {message}
        </div>
      )}

      {!outOfStock &&
        !message && (
          <p className="mt-3 text-center text-xs text-slate-400">
            Maksimal {stock}{" "}
            produk dapat ditambahkan.
          </p>
        )}
    </div>
  );
}