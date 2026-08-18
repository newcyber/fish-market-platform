"use client";

import {
  useMemo,
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
 *
 * PRODUCT VARIANT OPTION
 *
 * ============================================================
 */

interface ProductVariantOption {
  id: string;

  label: string;

  priceAdjustment: number;
}

/**
 * ============================================================
 *
 * PRODUCT WEIGHT OPTION
 *
 * ============================================================
 */

interface ProductWeightOption {
  id: string;

  label: string;

  price: number;
}

/**
 * ============================================================
 *
 * PROPS
 *
 * ============================================================
 */

interface AddToCartButtonProps {
  productId: string;

  stock: number;

  /**
   * Harga dasar produk.
   *
   * Digunakan apabila:
   *
   * - Produk tidak memiliki pilihan berat
   * - Customer belum memilih berat
   */
  basePrice: number;

  /**
   * Contoh:
   *
   * [
   *   {
   *     id: "...",
   *     label: "Utuh",
   *     priceAdjustment: 0
   *   },
   *   {
   *     id: "...",
   *     label: "Dibersihkan",
   *     priceAdjustment: 5000
   *   }
   * ]
   */
  variantOptions?: ProductVariantOption[];

  /**
   * Contoh:
   *
   * [
   *   {
   *     id: "...",
   *     label: "250gr",
   *     price: 15000
   *   },
   *   {
   *     id: "...",
   *     label: "500gr",
   *     price: 30000
   *   }
   * ]
   */
  weightOptions?: ProductWeightOption[];
}

/**
 * ============================================================
 *
 * FORMAT RUPIAH
 *
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
 *
 * ADD TO CART BUTTON
 *
 * ============================================================
 */

export default function AddToCartButton({
  productId,
  stock,
  basePrice,
  variantOptions = [],
  weightOptions = [],
}: AddToCartButtonProps) {
  /**
   * ==========================================================
   *
   * DEFAULT VARIANT
   *
   * ==========================================================
   */

  const defaultVariant =
    variantOptions[0]?.label ??
    null;

  /**
   * ==========================================================
   *
   * DEFAULT WEIGHT
   *
   * Jika hanya ada satu pilihan berat,
   * otomatis dipilih.
   *
   * ==========================================================
   */

  const defaultWeight =
    weightOptions.length === 1
      ? weightOptions[0].label
      : null;

  /**
   * ==========================================================
   *
   * STATE
   *
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
   *
   * STOCK
   *
   * ==========================================================
   */

  const outOfStock =
    stock <= 0;

  /**
   * ==========================================================
   *
   * REQUIREMENTS
   *
   * ==========================================================
   */

  const requiresVariant =
    variantOptions.length > 0;

  const requiresWeight =
    weightOptions.length > 0;

  /**
   * ==========================================================
   *
   * SELECTED VARIANT OBJECT
   *
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
   *
   * SELECTED WEIGHT OBJECT
   *
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
   *
   * CALCULATE UNIT PRICE
   *
   * Rumus:
   *
   * Harga Berat
   * +
   * Tambahan Harga Varian
   *
   * Jika tidak ada pilihan berat:
   *
   * Harga Dasar
   * +
   * Tambahan Harga Varian
   *
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
          selectedVariantOption
            .priceAdjustment
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

  /**
   * ==========================================================
   *
   * TOTAL PRICE
   *
   * ==========================================================
   */

  const totalPrice =
    unitPrice *
    quantity;

  /**
   * ==========================================================
   *
   * RESET MESSAGE
   *
   * ==========================================================
   */

  function resetMessage() {
    setSuccess(false);

    setMessage(null);
  }

  /**
   * ==========================================================
   *
   * DECREASE
   *
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
   *
   * INCREASE
   *
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
   *
   * SELECT VARIANT
   *
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
   *
   * SELECT WEIGHT
   *
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
   *
   * ADD TO CART
   *
   * ==========================================================
   */

  function handleAddToCart() {
    /**
     * STOCK VALIDATION
     */

    if (
      outOfStock
    ) {
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
     * VARIANT VALIDATION
     */

    if (
      requiresVariant &&
      !selectedVariant
    ) {
      setSuccess(false);

      setMessage(
        "Silakan pilih varian produk terlebih dahulu."
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
     *
     * Harga tidak dikirim dari client.
     *
     * Server harus menentukan kembali
     * harga berdasarkan:
     *
     * - Product
     * - Variant
     * - Weight
     *
     * Ini lebih aman daripada
     * mempercayai harga dari browser.
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
   *
   * RENDER
   *
   * ==========================================================
   */

  return (
    <div className="w-full space-y-6">
      {/* ====================================================== */}
      {/* LIVE PRICE */}
      {/* ====================================================== */}

      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Harga Produk
        </p>

        <div className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          {formatRupiah(
            unitPrice
          )}
        </div>

        {quantity > 1 && (
          <div className="mt-2 text-sm text-slate-500">
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
      {/* PRODUCT VARIANT */}
      {/* ====================================================== */}

      {requiresVariant && (
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
            {variantOptions.map(
              (
                variant
              ) => {
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
                    key={
                      variant.id
                    }
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
                      "flex min-h-12 flex-col items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold transition",
                      selected
                        ? "border-cyan-600 bg-cyan-50 text-cyan-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                      outOfStock ||
                      isPending
                        ? "cursor-not-allowed opacity-60"
                        : "",
                    ].join(
                      " "
                    )}
                  >
                    <span>
                      {
                        variant.label
                      }
                    </span>

                    {adjustment > 0 && (
                      <span className="mt-1 text-xs font-medium text-cyan-600">
                        +{" "}
                        {formatRupiah(
                          adjustment
                        )}
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

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
              (
                weight
              ) => {
                const selected =
                  selectedWeight ===
                  weight.label;

                return (
                  <button
                    key={
                      weight.id
                    }
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
                      "flex min-h-11 flex-col items-center justify-center rounded-xl border px-5 py-2 text-sm font-semibold transition",
                      selected
                        ? "border-cyan-600 bg-cyan-50 text-cyan-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                      outOfStock ||
                      isPending
                        ? "cursor-not-allowed opacity-60"
                        : "",
                    ].join(
                      " "
                    )}
                  >
                    <span>
                      {
                        weight.label
                      }
                    </span>

                    <span className="mt-1 text-[11px] font-medium opacity-75">
                      {formatRupiah(
                        Number(
                          weight.price
                        )
                      )}
                    </span>
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
          Pesan untuk Penjual
        </label>

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
          rows={4}
          maxLength={500}
          placeholder="Contoh: Tolong ikan dipotong menjadi 4 bagian, kepala dibuang, atau pesanan ditaruh di meja depan teras."
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        />

        <div className="mt-2 text-right text-xs text-slate-400">
          {
            customerNote.length
          }
          /500
        </div>
      </div>

      {/* ====================================================== */}
{/* QUANTITY + ADD TO CART */}
{/* ====================================================== */}

<div className="border-t border-slate-200 pt-5 sm:pt-6">
  <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">

    {/* QUANTITY */}

    <div
      className={[
        "flex h-12 w-full items-center justify-between rounded-full border bg-white px-2 sm:w-36 sm:flex-none",
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
        className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Kurangi jumlah"
      >
        <Minus className="h-4 w-4" />
      </button>

      <span className="min-w-10 text-center text-sm font-bold text-slate-900">
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
        className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
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
        "flex h-12 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition active:scale-[0.98] sm:flex-1 sm:px-6",

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
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" />

          <span>
            Menambahkan...
          </span>
        </>
      ) : success ? (
        <>
          <Check className="h-5 w-5 shrink-0" />

          <span>
            Berhasil Ditambahkan
          </span>
        </>
      ) : outOfStock ? (
        <span>
          Stok Habis
        </span>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5 shrink-0" />

          <span>
            Tambah ke Keranjang
          </span>
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
            ].join(
              " "
            )}
          >
            {
              message
            }
          </div>
        )}

        {/* STOCK */}

        {!outOfStock && (
          <p className="mt-3 text-center text-xs text-slate-400">
            Stok tersedia:{" "}
            {
              stock
            }
          </p>
        )}
      </div>
    </div>
  );
}