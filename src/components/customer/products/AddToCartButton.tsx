"use client";

import {
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

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
 * PRODUCT VARIANT OPTION
 * ============================================================
 */

interface ProductVariantOption {
  id: string;

  label: string;

  priceAdjustment: number;
}

/**
 * ============================================================
 * PRODUCT WEIGHT OPTION
 * ============================================================
 */

interface ProductWeightOption {
  id: string;

  label: string;

  price: number;
}

/**
 * ============================================================
 * PROPS
 * ============================================================
 */

interface AddToCartButtonProps {
  productId: string;

  stock: number;

  basePrice: number;

  variantOptions?: ProductVariantOption[];

  weightOptions?: ProductWeightOption[];
}

/**
 * ============================================================
 * FORMAT RUPIAH
 * ============================================================
 */

function formatRupiah(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(
    Number.isFinite(value)
      ? Math.max(0, value)
      : 0
  );
}

/**
 * ============================================================
 * ADD TO CART BUTTON
 * ============================================================
 */

export default function AddToCartButton({
  productId,
  stock,
  basePrice,
  variantOptions = [],
  weightOptions = [],
}: AddToCartButtonProps) {
  const router =
    useRouter();

  /**
   * ==========================================================
   * DEFAULT OPTIONS
   * ==========================================================
   */

  const defaultVariant =
    variantOptions[0]?.label ??
    null;

  const defaultWeight =
    weightOptions.length === 1
      ? weightOptions[0]?.label ?? null
      : null;

  /**
   * ==========================================================
   * STATE
   * ==========================================================
   */

  const [
    quantity,
    setQuantity,
  ] =
    useState(1);

  const [
    selectedVariant,
    setSelectedVariant,
  ] =
    useState<string | null>(
      defaultVariant
    );

  const [
    selectedWeight,
    setSelectedWeight,
  ] =
    useState<string | null>(
      defaultWeight
    );

  const [
    customerNote,
    setCustomerNote,
  ] =
    useState("");

  const [
    isPending,
    startTransition,
  ] =
    useTransition();

  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null
    );

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  /**
   * ==========================================================
   * STOCK
   * ==========================================================
   */

  const outOfStock =
    stock <= 0;

  /**
   * ==========================================================
   * REQUIREMENTS
   * ==========================================================
   */

  const requiresVariant =
    variantOptions.length > 0;

  const requiresWeight =
    weightOptions.length > 0;

  /**
   * ==========================================================
   * SELECTED VARIANT
   * ==========================================================
   */

  const selectedVariantOption =
    useMemo(
      () =>
        variantOptions.find(
          (variant) =>
            variant.label ===
            selectedVariant
        ) ?? null,
      [
        variantOptions,
        selectedVariant,
      ]
    );

  /**
   * ==========================================================
   * SELECTED WEIGHT
   * ==========================================================
   */

  const selectedWeightOption =
    useMemo(
      () =>
        weightOptions.find(
          (weight) =>
            weight.label ===
            selectedWeight
        ) ?? null,
      [
        weightOptions,
        selectedWeight,
      ]
    );

  /**
   * ==========================================================
   * PRICE CALCULATION
   * ==========================================================
   */

  const weightPrice =
    selectedWeightOption
      ? Number(
          selectedWeightOption.price
        )
      : Number(basePrice);

  const variantAdjustment =
    selectedVariantOption
      ? Number(
          selectedVariantOption.priceAdjustment
        )
      : 0;

  const unitPrice =
    Math.max(
      0,
      weightPrice
    ) +
    Math.max(
      0,
      variantAdjustment
    );

  const totalPrice =
    unitPrice *
    quantity;

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
   * QUANTITY
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
   * OPTION SELECTORS
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
   * VALIDATION
   * ==========================================================
   */

  function validateSelection() {
    if (outOfStock) {
      setSuccess(false);

      setMessage(
        "Produk sedang habis."
      );

      return false;
    }

    if (quantity < 1) {
      setSuccess(false);

      setMessage(
        "Jumlah produk minimal 1."
      );

      return false;
    }

    if (quantity > stock) {
      setSuccess(false);

      setMessage(
        `Jumlah maksimal ${stock}.`
      );

      return false;
    }

    if (
      requiresVariant &&
      !selectedVariant
    ) {
      setSuccess(false);

      setMessage(
        "Silakan pilih varian produk terlebih dahulu."
      );

      return false;
    }

    if (
      requiresWeight &&
      !selectedWeight
    ) {
      setSuccess(false);

      setMessage(
        "Silakan pilih berat produk terlebih dahulu."
      );

      return false;
    }

    return true;
  }

  /**
   * ==========================================================
   * SUBMIT
   * ==========================================================
   *
   * buyNow = false
   * → Tambahkan ke keranjang
   *
   * buyNow = true
   * → Tambahkan ke keranjang
   * → Redirect ke halaman cart
   *
   * ==========================================================
   */

  function submitProduct(
    buyNow = false
  ) {
    if (
      !validateSelection()
    ) {
      return;
    }

    resetMessage();

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

        /**
         * BUY NOW
         */

        if (buyNow) {
          router.push(
            "/customer/cart"
          );

          router.refresh();
        }
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
      {/* LIVE PRICE */}
      {/* ====================================================== */}

      <div className="border-y border-slate-200 bg-slate-50 px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Harga Produk
        </p>

        <div className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {formatRupiah(
            unitPrice
          )}
        </div>

        {quantity > 1 && (
          <div className="mt-2 text-xs text-slate-500">
            {quantity} ×{" "}
            {formatRupiah(
              unitPrice
            )}

            <span className="mx-2">
              =
            </span>

            <span className="font-semibold text-slate-900">
              {formatRupiah(
                totalPrice
              )}
            </span>
          </div>
        )}
      </div>

      {/* ====================================================== */}
      {/* VARIANT */}
      {/* ====================================================== */}

      {requiresVariant && (
        <div className="grid gap-3 sm:grid-cols-[130px_minmax(0,1fr)]">
          <div>
            <h3 className="text-sm text-slate-500">
              Varian Produk
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Pilih kondisi produk.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {variantOptions.map(
              (variant) => {
                const selected =
                  selectedVariant ===
                  variant.label;

                const adjustment =
                  Number(
                    variant.priceAdjustment ??
                      0
                  );

                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() =>
                      selectVariant(
                        variant.label
                      )
                    }
                    disabled={
                      outOfStock ||
                      isPending
                    }
                    className={[
  "min-h-[54px] rounded-xl border px-4 py-2 text-sm transition",
  selected
    ? "border-cyan-600 bg-cyan-50 text-cyan-700 shadow-sm"
    : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-slate-50",
  outOfStock ||
  isPending
    ? "cursor-not-allowed opacity-60"
    : "",
].join(" ")}
                  >
                    <div className="font-medium">
                      {variant.label}
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* WEIGHT */}
      {/* ====================================================== */}

      {requiresWeight && (
        <div className="grid gap-3 sm:grid-cols-[130px_minmax(0,1fr)]">
          <div>
            <h3 className="text-sm text-slate-500">
              Berat Produk
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Pilih berat produk.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
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
  "min-w-[78px] rounded-xl border px-4 py-2 text-sm font-medium transition",
  selected
    ? "border-cyan-600 bg-cyan-50 text-cyan-700 shadow-sm"
    : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-slate-50",
  outOfStock ||
  isPending
    ? "cursor-not-allowed opacity-60"
    : "",
].join(" ")}
                  >
                    <div className="font-medium">
                      {weight.label}
                    </div>
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

      <div className="grid gap-3 sm:grid-cols-[130px_minmax(0,1fr)]">
        <div>
          <label
            htmlFor="customer-note"
            className="text-sm text-slate-500"
          >
            Pesan untuk Penjual
          </label>
        </div>

        <div>
          <textarea
            id="customer-note"
            value={
              customerNote
            }
            onChange={(
              event
            ) => {
              setCustomerNote(
                event.target.value
              );

              resetMessage();
            }}
            disabled={
              outOfStock ||
              isPending
            }
            rows={3}
            maxLength={500}
            placeholder="Contoh: Tolong ikan dipotong sesuai kebutuhan."
            className="w-full resize-none border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <div className="mt-1 text-right text-[10px] text-slate-400">
            {customerNote.length}
            /500
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* QUANTITY */}
      {/* ====================================================== */}

      <div className="grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-[130px_minmax(0,1fr)]">
        <div className="text-sm text-slate-500">
          Kuantitas
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div
            className={[
              "flex h-11 items-center border bg-white",
              outOfStock
                ? "border-slate-200 opacity-60"
                : "border-slate-300",
            ].join(
              " "
            )}
          >
            <button
              type="button"
              onClick={decrease}
              disabled={
                outOfStock ||
                isPending ||
                quantity <= 1
              }
              className="flex h-full w-10 items-center justify-center border-r border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Kurangi jumlah"
            >
              <Minus className="h-4 w-4" />
            </button>

            <span className="flex h-full min-w-12 items-center justify-center text-sm font-medium text-slate-900">
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
              className="flex h-full w-10 items-center justify-center border-l border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Tambah jumlah"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {!outOfStock && (
            <span className="text-xs text-slate-400">
              {stock} tersedia
            </span>
          )}
        </div>
      </div>

{/* ====================================================== */}
{/* ACTION BUTTONS */}
{/* ====================================================== */}

<div className="border-t border-slate-200 pt-6">

  <div className="flex flex-col gap-3 sm:flex-row">

    {/* ADD TO CART */}

    <button
      type="button"
      onClick={() =>
        submitProduct(false)
      }
      disabled={
        outOfStock ||
        isPending
      }
      className={[
        "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold whitespace-nowrap transition active:scale-[0.99] sm:flex-1",
        outOfStock
          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
          : "border-cyan-600 bg-cyan-50 text-cyan-700 hover:bg-cyan-100",
        isPending
          ? "cursor-wait opacity-70"
          : "",
      ].join(" ")}
    >
      {isPending ? (
        <>
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" />

          <span>
            Memproses...
          </span>
        </>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5 shrink-0" />

          <span>
            Masukkan Keranjang
          </span>
        </>
      )}
    </button>

    {/* BUY NOW */}

    <button
      type="button"
      onClick={() =>
        submitProduct(true)
      }
      disabled={
        outOfStock ||
        isPending
      }
      className={[
        "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold whitespace-nowrap text-white transition active:scale-[0.99] sm:flex-1",
        outOfStock
          ? "cursor-not-allowed bg-slate-300"
          : "bg-cyan-600 hover:bg-cyan-700",
        isPending
          ? "cursor-wait opacity-70"
          : "",
      ].join(" ")}
    >
      {isPending ? (
        <>
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" />

          <span>
            Memproses...
          </span>
        </>
      ) : (
        <span>
          Beli Sekarang
        </span>
      )}
    </button>

  </div>

</div>

      {/* ====================================================== */}
      {/* MESSAGE */}
      {/* ====================================================== */}

      {message && (
        <div
          className={[
            "border px-4 py-3 text-sm",
            success
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          ].join(
            " "
          )}
        >
          {success && (
            <Check className="mr-2 inline h-4 w-4" />
          )}

          {message}
        </div>
      )}
    </div>
  );
}