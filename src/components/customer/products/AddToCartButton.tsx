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

import {
  addToCartAction,
} from "@/actions/cart/add-to-cart";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface ProductWeightOption {
  id: string;

  label: string;
}

interface AddToCartButtonProps {
  productId: string;

  stock: number;

  weightOptions?: ProductWeightOption[];
}

/**
 * ============================================================
 * PRODUCT VARIANTS
 * ============================================================
 */

const PRODUCT_VARIANTS = [
  "Utuh",
  "Dibersihkan",
];

/**
 * ============================================================
 * ADD TO CART BUTTON
 * ============================================================
 */

export default function AddToCartButton({
  productId,
  stock,
  weightOptions = [],
}: AddToCartButtonProps) {
  /**
   * ==========================================================
   * STATE
   * ==========================================================
   */

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  const [
    selectedVariant,
    setSelectedVariant,
  ] = useState(
    PRODUCT_VARIANTS[0]
  );

  const [
    selectedWeight,
    setSelectedWeight,
  ] = useState<string | null>(
    weightOptions.length === 1
      ? weightOptions[0].label
      : null
  );

  const [
    customerNote,
    setCustomerNote,
  ] = useState("");

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

  /**
   * ==========================================================
   * STOCK
   * ==========================================================
   */

  const outOfStock =
    stock <= 0;

  const requiresWeight =
    weightOptions.length > 0;

  /**
   * ==========================================================
   * RESET MESSAGE
   * ==========================================================
   */

  function resetMessage() {
    setSuccess(false);

    setMessage(null);
  }

  /**
   * ==========================================================
   * DECREASE
   * ==========================================================
   */

  function decrease() {
    setQuantity(
      (current) =>
        Math.max(
          1,
          current - 1
        )
    );

    resetMessage();
  }

  /**
   * ==========================================================
   * INCREASE
   * ==========================================================
   */

  function increase() {
    setQuantity(
      (current) =>
        Math.min(
          stock,
          current + 1
        )
    );

    resetMessage();
  }

  /**
   * ==========================================================
   * SELECT VARIANT
   * ==========================================================
   */

  function selectVariant(
    variant: string
  ) {
    setSelectedVariant(
      variant
    );

    resetMessage();
  }

  /**
   * ==========================================================
   * SELECT WEIGHT
   * ==========================================================
   */

  function selectWeight(
    weight: string
  ) {
    setSelectedWeight(
      weight
    );

    resetMessage();
  }

  /**
   * ==========================================================
   * ADD TO CART
   * ==========================================================
   */

  function handleAddToCart() {
    /**
     * STOCK VALIDATION
     */

    if (outOfStock) {
      return;
    }

    /**
     * QUANTITY VALIDATION
     */

    if (
      quantity < 1
    ) {
      setSuccess(false);

      setMessage(
        "Jumlah produk minimal 1."
      );

      return;
    }

    if (
      quantity > stock
    ) {
      setSuccess(false);

      setMessage(
        `Jumlah maksimal ${stock}.`
      );

      return;
    }

    /**
     * WEIGHT VALIDATION
     */

    if (
      requiresWeight &&
      !selectedWeight
    ) {
      setSuccess(false);

      setMessage(
        "Silakan pilih berat produk terlebih dahulu."
      );

      return;
    }

    /**
     * RESET MESSAGE
     */

    resetMessage();

    /**
     * SERVER ACTION
     */

    startTransition(
      async () => {
        const result =
          await addToCartAction({
            productId,

            quantity,

            productVariant:
              selectedVariant,

            productWeight:
              selectedWeight,

            customerNote,
          });

        if (
          !result.success
        ) {
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
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="w-full space-y-6">
      {/* ====================================================== */}
      {/* PRODUCT VARIANT */}
      {/* ====================================================== */}

      <div>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Varian Produk
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Pilih kondisi produk yang Anda inginkan.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {PRODUCT_VARIANTS.map(
            (variant) => {
              const selected =
                selectedVariant ===
                variant;

              return (
                <button
                  key={variant}
                  type="button"
                  onClick={() =>
                    selectVariant(
                      variant
                    )
                  }
                  disabled={
                    outOfStock ||
                    isPending
                  }
                  className={[
                    "flex min-h-12 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition",
                    selected
                      ? "border-cyan-600 bg-cyan-50 text-cyan-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                    outOfStock ||
                    isPending
                      ? "cursor-not-allowed opacity-60"
                      : "",
                  ].join(" ")}
                >
                  {variant}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* ====================================================== */}
      {/* PRODUCT WEIGHT */}
      {/* ====================================================== */}

      {requiresWeight && (
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Berat Produk
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Pilih berat sesuai kebutuhan Anda.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {weightOptions.map(
              (weight) => {
                const selected =
                  selectedWeight ===
                  weight.label;

                return (
                  <button
                    key={weight.id}
                    type="button"
                    onClick={() =>
                      selectWeight(
                        weight.label
                      )
                    }
                    disabled={
                      outOfStock ||
                      isPending
                    }
                    className={[
                      "min-h-11 rounded-xl border px-5 text-sm font-semibold transition",
                      selected
                        ? "border-cyan-600 bg-cyan-50 text-cyan-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                      outOfStock ||
                      isPending
                        ? "cursor-not-allowed opacity-60"
                        : "",
                    ].join(" ")}
                  >
                    {weight.label}
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* CUSTOMER NOTE */}
      {/* ====================================================== */}

      <div>
        <label
          htmlFor="customer-note"
          className="mb-2 block text-sm font-semibold text-slate-900"
        >
          Catatan Pembelian
        </label>

        <textarea
          id="customer-note"
          value={customerNote}
          onChange={(event) => {
            setCustomerNote(
              event.target.value
            );

            resetMessage();
          }}
          disabled={
            outOfStock ||
            isPending
          }
          rows={4}
          maxLength={500}
          placeholder="Contoh: Tolong ikan dipotong menjadi 4 bagian, kepala dibuang, atau pesanan ditaruh di meja depan teras."
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        />

        <div className="mt-2 text-right text-xs text-slate-400">
          {customerNote.length}/500
        </div>
      </div>

      {/* ====================================================== */}
      {/* QUANTITY + BUTTON */}
      {/* ====================================================== */}

      <div className="border-t border-slate-200 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* QUANTITY */}

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
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Kurangi jumlah"
            >
              <Minus className="h-4 w-4" />
            </button>

            <span className="min-w-8 text-center text-sm font-bold text-slate-900">
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
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Tambah jumlah"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* ADD TO CART */}

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
                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                : success
                  ? "bg-emerald-600 text-white"
                  : "bg-cyan-600 text-white hover:bg-cyan-700",
              isPending
                ? "cursor-wait opacity-80"
                : "",
            ].join(" ")}
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />

                Menambahkan...
              </>
            ) : success ? (
              <>
                <Check className="h-5 w-5" />

                Berhasil Ditambahkan
              </>
            ) : outOfStock ? (
              "Stok Habis"
            ) : (
              <>
                <ShoppingCart className="h-5 w-5" />

                Tambah ke Keranjang
              </>
            )}
          </button>
        </div>

        {/* MESSAGE */}

        {message && (
          <div
            className={[
              "mt-4 rounded-xl border px-4 py-3 text-sm",
              success
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700",
            ].join(" ")}
          >
            {message}
          </div>
        )}

        {/* STOCK */}

        {!outOfStock && (
          <p className="mt-3 text-center text-xs text-slate-400">
            Stok tersedia: {stock}
          </p>
        )}
      </div>
    </div>
  );
}