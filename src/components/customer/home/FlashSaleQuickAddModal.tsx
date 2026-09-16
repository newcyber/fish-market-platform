"use client";

import {
  Check,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { addToCartAction } from "@/actions/cart/add-to-cart";

type NumericValue =
  | number
  | {
      toNumber: () => number;
    };

interface FlashSaleVariantOption {
  id: string;
  groupId: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

interface FlashSaleVariantGroup {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  options: FlashSaleVariantOption[];
}

interface FlashSaleSkuOption {
  id: string;
  skuId: string;
  variantOptionId: string;
  variantOption: FlashSaleVariantOption;
}

interface FlashSaleSku {
  id: string;
  sku: string;
  price: NumericValue;
  stock: number;
  isActive: boolean;
  skuOptions: FlashSaleSkuOption[];
}

interface FlashSaleProduct {
  id: string;
  name: string;
  slug: string;
  price: NumericValue;
  variantGroups?: FlashSaleVariantGroup[];
  skus?: FlashSaleSku[];
}

interface FlashSaleItem {
  id: string;
  originalPrice: NumericValue;
  flashPrice: NumericValue;
  stockLimit: number;
  soldQuantity: number;
  product: FlashSaleProduct;
  sku: FlashSaleSku | null;
}

interface FlashSaleQuickAddModalProps {
  item: FlashSaleItem;
  flashSaleItems: FlashSaleItem[];
  onClose: () => void;
}

function toNumber(value: NumericValue): number {
  return typeof value === "number"
    ? value
    : value.toNumber();
}

function formatRupiah(value: NumericValue): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, toNumber(value)));
}

export default function FlashSaleQuickAddModal({
  item,
  flashSaleItems,
  onClose,
}: FlashSaleQuickAddModalProps) {
  const product = item.product;

  const variantGroups = useMemo(
    () =>
      (product.variantGroups ?? [])
        .filter(
          (group) =>
            group.isActive &&
            group.options.some(
              (option) => option.isActive
            )
        )
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder
        ),
    [product.variantGroups]
  );

  const skus = useMemo(
    () =>
      (product.skus ?? []).filter(
        (sku) =>
          sku.isActive &&
          sku.stock > 0
      ),
    [product.skus]
  );

  const [selectedOptions, setSelectedOptions] =
    useState<Record<string, string>>({});

  const [quantity, setQuantity] =
    useState(1);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [message, setMessage] =
  useState<string | null>(null);

  const [success, setSuccess] =
   useState(false);

  const [mounted, setMounted] =
   useState(false);

  useEffect(() => {
   setMounted(true);

  return () => {
    setMounted(false);
  };
}, []);

  /**
   * ============================================================
   * INITIAL SKU
   * ============================================================
   *
   * Kalau Flash Sale item sudah memiliki SKU,
   * otomatis pilih variant SKU tersebut.
   */
  useEffect(() => {
    if (!item.sku) {
      return;
    }

    const initialSelections: Record<
      string,
      string
    > = {};

    for (const skuOption of item.sku.skuOptions) {
      initialSelections[
        skuOption.variantOption.groupId
      ] = skuOption.variantOptionId;
    }

    setSelectedOptions(
      initialSelections
    );
  }, [item.sku]);

  /**
   * ============================================================
   * SELECTED SKU
   * ============================================================
   */
  const selectedSku = useMemo(() => {
    if (variantGroups.length === 0) {
      return (
        skus.find(
          (sku) =>
            sku.id === item.sku?.id
        ) ??
        skus[0] ??
        null
      );
    }

    const allGroupsSelected =
      variantGroups.every(
        (group) =>
          Boolean(
            selectedOptions[group.id]
          )
      );

    if (!allGroupsSelected) {
      return null;
    }

    return (
      skus.find((sku) =>
        variantGroups.every((group) => {
          const selectedOptionId =
            selectedOptions[group.id];

          return sku.skuOptions.some(
            (skuOption) =>
              skuOption.variantOptionId ===
              selectedOptionId
          );
        })
      ) ?? null
    );
  }, [
    item.sku?.id,
    selectedOptions,
    skus,
    variantGroups,
  ]);

  /**
   * ============================================================
   * FLASH SALE ITEM UNTUK SKU TERPILIH
   * ============================================================
   */
  const activeFlashSaleItem =
    useMemo(() => {
      if (!selectedSku) {
        return null;
      }

      return (
        flashSaleItems.find(
          (flashSaleItem) =>
            flashSaleItem.product.id ===
              product.id &&
            flashSaleItem.sku?.id ===
              selectedSku.id &&
            flashSaleItem.stockLimit >
              flashSaleItem.soldQuantity
        ) ?? null
      );
    }, [
      flashSaleItems,
      product.id,
      selectedSku,
    ]);

  /**
   * ============================================================
   * STOCK
   * ============================================================
   */
  const physicalStock =
    selectedSku?.stock ?? 0;

  const flashSaleRemaining =
    activeFlashSaleItem
      ? Math.max(
          0,
          activeFlashSaleItem.stockLimit -
            activeFlashSaleItem.soldQuantity
        )
      : Infinity;

  const maxQuantity =
    selectedSku
      ? Math.max(
          0,
          Math.min(
            physicalStock,
            flashSaleRemaining
          )
        )
      : 0;

  /**
   * Kalau quantity melebihi stock setelah
   * ganti variant, otomatis clamp.
   */
  useEffect(() => {
    if (maxQuantity <= 0) {
      setQuantity(1);
      return;
    }

    setQuantity((current) =>
      Math.min(
        Math.max(1, current),
        maxQuantity
      )
    );
  }, [maxQuantity]);

  /**
   * ============================================================
   * PRICE
   * ============================================================
   */
  const currentPrice =
    activeFlashSaleItem
      ? activeFlashSaleItem.flashPrice
      : selectedSku?.price ??
        product.price;

  const originalPrice =
    activeFlashSaleItem?.originalPrice ??
    selectedSku?.price ??
    product.price;

  const isDiscounted =
    toNumber(currentPrice) <
    toNumber(originalPrice);

  /**
   * ============================================================
   * OPTION AVAILABILITY
   * ============================================================
   *
   * Option dianggap tersedia kalau ada SKU aktif
   * yang:
   *
   * 1. mempunyai option tersebut
   * 2. tetap compatible dengan pilihan group lainnya
   */
  function isOptionAvailable(
    groupId: string,
    optionId: string
  ): boolean {
    return skus.some((sku) => {
      const hasCurrentOption =
        sku.skuOptions.some(
          (skuOption) =>
            skuOption.variantOptionId ===
            optionId
        );

      if (!hasCurrentOption) {
        return false;
      }

      return variantGroups.every(
        (group) => {
          if (group.id === groupId) {
            return true;
          }

          const selectedOptionId =
            selectedOptions[group.id];

          if (!selectedOptionId) {
            return true;
          }

          return sku.skuOptions.some(
            (skuOption) =>
              skuOption.variantOptionId ===
              selectedOptionId
          );
        }
      );
    });
  }

  /**
   * ============================================================
   * SELECT OPTION
   * ============================================================
   */
  function handleSelectOption(
    groupId: string,
    optionId: string
  ) {
    setSelectedOptions((current) => ({
      ...current,
      [groupId]: optionId,
    }));

    setMessage(null);
    setSuccess(false);
  }

  /**
   * ============================================================
   * QUANTITY
   * ============================================================
   */
  function decreaseQuantity() {
    setQuantity((current) =>
      Math.max(1, current - 1)
    );

    setMessage(null);
  }

  function increaseQuantity() {
    if (maxQuantity <= 0) {
      return;
    }

    setQuantity((current) =>
      Math.min(
        maxQuantity,
        current + 1
      )
    );

    setMessage(null);
  }

  /**
   * ============================================================
   * ADD TO CART
   * ============================================================
   */
  async function handleAddToCart() {
    setMessage(null);
    setSuccess(false);

    if (!selectedSku) {
      setMessage(
        "Silakan pilih semua variant terlebih dahulu."
      );
      return;
    }

    if (selectedSku.stock <= 0) {
      setMessage(
        "Variant ini sedang habis."
      );
      return;
    }

    if (maxQuantity <= 0) {
      setMessage(
        "Stok atau kuota Flash Sale sudah habis."
      );
      return;
    }

    if (quantity > maxQuantity) {
      setMessage(
        `Maksimal pembelian ${maxQuantity} item.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const result =
        await addToCartAction({
          productId: product.id,
          skuId: selectedSku.id,
          quantity,
          customerNote: null,
        });

      if (!result.success) {
        setMessage(
          result.message ??
            "Produk gagal ditambahkan ke keranjang."
        );
        return;
      }

      window.dispatchEvent(
        new Event("cart-updated")
      );

      setSuccess(true);

      window.setTimeout(() => {
        onClose();
      }, 700);
    } catch (error) {
      console.error(
        "[FLASH_SALE_QUICK_ADD]",
        error
      );

      setMessage(
        "Terjadi kesalahan saat menambahkan produk ke keranjang."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * ============================================================
   * CLOSE VIA ESC
   * ============================================================
   */
  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [onClose]);

  /**
   * ============================================================
   * LOCK BODY SCROLL
   * ============================================================
   */
  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, []);

if (!mounted) {
  return null;
}

if (!mounted) {
  return null;
}

return createPortal(
  <div
    className="
      fixed
      inset-0
      z-[9999]
      flex
      items-center
      justify-center
      bg-slate-950/55
      p-4
      backdrop-blur-[2px]
    "
    role="dialog"
    aria-modal="true"
    aria-labelledby="flash-sale-quick-add-title"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }}
  >
    {/* ====================================================
        MODAL CONTAINER
    ==================================================== */}

    <div
      className="
        flex
        max-h-[92vh]
        w-full
        max-w-md
        flex-col
        overflow-hidden
        rounded-2xl
        bg-white
        shadow-[0_24px_80px_rgba(15,23,42,0.28)]
      "
    >
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div
        className="
          flex
          shrink-0
          items-start
          justify-between
          gap-4
          border-b
          border-slate-100
          px-5
          py-4
        "
      >
        <div className="min-w-0">
          <h2
            id="flash-sale-quick-add-title"
            className="
              truncate
              text-base
              font-black
              text-slate-900
            "
          >
            {product.name}
          </h2>

          <p
            className="
              mt-1
              text-xs
              font-medium
              text-slate-500
            "
          >
            Produk siap ditambahkan ke
            keranjang
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="
            inline-flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-full
            text-slate-400
            transition
            hover:bg-slate-100
            hover:text-slate-700
          "
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ====================================================
          BODY
      ==================================================== */}

      <div
        className="
          min-h-0
          flex-1
          overflow-y-auto
          px-5
          py-4
        "
      >
        {/* ====================================================
            PRODUCT SUMMARY
        ==================================================== */}

        <div
          className="
            rounded-xl
            border
            border-slate-100
            bg-slate-50
            p-4
          "
        >
          <p
            className="
              text-xs
              font-bold
              text-slate-700
            "
          >
            Produk siap ditambahkan
          </p>

          <div
            className="
              mt-2
              flex
              items-center
              justify-between
              gap-3
            "
          >
            <div className="min-w-0">
              <p
                className="
                  truncate
                  text-xs
                  font-semibold
                  text-slate-500
                "
              >
                {selectedSku?.sku ??
                  item.sku?.sku ??
                  "SKU"}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p
                className="
                  text-sm
                  font-black
                  text-[var(--ocean-900)]
                "
              >
                {formatRupiah(currentPrice)}
              </p>

              {isDiscounted && (
                <p
                  className="
                    mt-0.5
                    text-[10px]
                    font-medium
                    text-slate-400
                    line-through
                  "
                >
                  {formatRupiah(originalPrice)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ====================================================
            VARIANT
        ==================================================== */}

        {variantGroups.length > 0 && (
          <div className="mt-5">
            <div
              className="
                flex
                items-center
                justify-between
              "
            >
              <h3
                className="
                  text-sm
                  font-black
                  text-slate-900
                "
              >
                Pilihan
              </h3>
            </div>

            <div className="mt-4 space-y-4">
              {variantGroups.map((group) => (
                <div key={group.id}>
                  <p
                    className="
                      mb-2
                      text-xs
                      font-bold
                      text-slate-700
                    "
                  >
                    {group.name}
                  </p>

                  <div
                    className="
                      flex
                      flex-wrap
                      gap-2
                    "
                  >
                    {group.options
                      .filter(
                        (option) =>
                          option.isActive
                      )
                      .map((option) => {
                        const selected =
                          selectedOptions[
                            group.id
                          ] === option.id;

                        const available =
                          isOptionAvailable(
                            group.id,
                            option.id
                          );

                        return (
                          <button
                            key={option.id}
                            type="button"
                            disabled={!available}
                            onClick={() =>
                              handleSelectOption(
                                group.id,
                                option.id
                              )
                            }
                            className={`
                              rounded-lg
                              border
                              px-3
                              py-2
                              text-xs
                              font-bold
                              transition
                              ${
                                selected
                                  ? "border-[var(--ocean-900)] bg-[var(--ocean-900)] text-white"
                                  : available
                                    ? "border-slate-200 bg-white text-slate-700 hover:border-[var(--ocean-900)] hover:text-[var(--ocean-900)]"
                                    : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through"
                              }
                            `}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================
            SELECTED SKU INFO
        ==================================================== */}

        <div
          className="
            mt-5
            rounded-xl
            border
            border-slate-100
            bg-white
            p-4
            shadow-[0_2px_10px_rgba(15,23,42,0.04)]
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-3
            "
          >
            <div>
              <p
                className="
                  text-xs
                  font-bold
                  text-slate-500
                "
              >
                SKU
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-black
                  text-slate-800
                "
              >
                {selectedSku?.sku ??
                  item.sku?.sku ??
                  "-"}
              </p>
            </div>

            <div className="text-right">
              <p
                className="
                  text-xs
                  font-bold
                  text-slate-500
                "
              >
                Stok tersedia
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-black
                  text-[var(--ocean-900)]
                "
              >
                {selectedSku
                  ? maxQuantity
                  : 0}
              </p>
            </div>
          </div>
        </div>

        {/* ====================================================
            QUANTITY
        ==================================================== */}

        <div className="mt-5">
          <div
            className="
              flex
              items-end
              justify-between
              gap-3
            "
          >
            <div>
              <h3
                className="
                  text-sm
                  font-black
                  text-slate-900
                "
              >
                Jumlah
              </h3>

              <p
                className="
                  mt-1
                  text-xs
                  font-medium
                  text-slate-400
                "
              >
                Maksimal sesuai stok
              </p>
            </div>

            <div
              className="
                inline-flex
                items-center
                rounded-xl
                border
                border-slate-200
                bg-white
              "
            >
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={
                  quantity <= 1 ||
                  isSubmitting ||
                  !selectedSku
                }
                className="
                  inline-flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  text-slate-600
                  transition
                  hover:bg-slate-50
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
                aria-label="Kurangi jumlah"
              >
                <Minus className="h-4 w-4" />
              </button>

              <span
                className="
                  flex
                  h-10
                  min-w-10
                  items-center
                  justify-center
                  border-x
                  border-slate-200
                  px-3
                  text-sm
                  font-black
                  text-slate-800
                "
              >
                {quantity}
              </span>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={
                  quantity >= maxQuantity ||
                  isSubmitting ||
                  !selectedSku
                }
                className="
                  inline-flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  text-slate-600
                  transition
                  hover:bg-slate-50
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
                aria-label="Tambah jumlah"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ====================================================
            MESSAGE
        ==================================================== */}

        {message && (
          <div
            className="
              mt-4
              rounded-xl
              border
              border-rose-100
              bg-rose-50
              px-4
              py-3
              text-xs
              font-semibold
              text-rose-600
            "
          >
            {message}
          </div>
        )}

        {/* ====================================================
            SUCCESS
        ==================================================== */}

        {success && (
          <div
            className="
              mt-4
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-emerald-100
              bg-emerald-50
              px-4
              py-3
              text-xs
              font-bold
              text-emerald-600
            "
          >
            <Check className="h-4 w-4" />

            Produk berhasil ditambahkan ke
            keranjang.
          </div>
        )}
      </div>

      {/* ====================================================
          FOOTER
      ==================================================== */}

      <div
        className="
          shrink-0
          border-t
          border-slate-100
          bg-white
          p-4
        "
      >
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={
            isSubmitting ||
            success ||
            !selectedSku ||
            maxQuantity <= 0
          }
          className="
            flex
            h-12
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-[var(--ocean-900)]
            px-4
            text-sm
            font-black
            text-white
            shadow-sm
            transition
            hover:bg-[var(--ocean-950)]
            active:scale-[0.99]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {isSubmitting ? (
            <>
              <Loader2
                className="
                  h-5
                  w-5
                  animate-spin
                "
              />

              Menambahkan...
            </>
          ) : success ? (
            <>
              <Check className="h-5 w-5" />

              Berhasil Ditambahkan
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />

              Tambah ke Keranjang
            </>
          )}
        </button>
      </div>
    </div>
  </div>,
  document.body
);
}