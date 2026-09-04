"use client";

import {
  useEffect,
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
  X,
} from "lucide-react";

import {
  addToCartAction,
} from "@/actions/cart/add-to-cart";

import {
  getProductVariants,
} from "@/actions/cart/get-product-variants";

interface ProductVariantOption {
  id: string;
  label: string;
  sortOrder: number;
}

interface ProductVariantGroup {
  id: string;
  name: string;
  sortOrder: number;
  options: ProductVariantOption[];
}

interface ProductSkuOption {
  variantOptionId: string;
  label: string;
  groupId: string;
  groupName: string;
}

interface ProductSku {
  id: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
  options: ProductSkuOption[];
}

interface ProductVariantData {
  productId: string;
  productName: string;
  variantGroups: ProductVariantGroup[];
  skus: ProductSku[];
}

interface HomeProductQuickAddSheetProps {
  productId: string;
  productName?: string;
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(
    Number.isFinite(value)
      ? Math.max(0, value)
      : 0
  );
}

export default function HomeProductQuickAddSheet({
  productId,
  productName,
  open,
  onClose,
  onAdded,
}: HomeProductQuickAddSheetProps) {
  const [
    data,
    setData,
  ] = useState<ProductVariantData | null>(null);

  const [
    selectedOptions,
    setSelectedOptions,
  ] = useState<Record<string, string>>({});

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
  ] = useState<string | null>(null);

  const [
    success,
    setSuccess,
  ] = useState(false);

  /**
   * ==========================================================
   * LOAD PRODUCT VARIANTS
   * ==========================================================
   *
   * Variant hanya diambil ketika sheet dibuka.
   * Homepage tidak membawa seluruh SKU sejak awal.
   */
useEffect(() => {
  if (!open || !productId) {
    return;
  }

  let cancelled = false;

  getProductVariants({
    productId,
  })
    .then((result) => {
      if (cancelled) {
        return;
      }

      if (!result.success || !result.data) {
        setMessage(
          result.message ??
            "Unable to load product options."
        );

        return;
      }

      setData(result.data);
    })
    .catch((error) => {
      console.error(
        "[HOME_PRODUCT_QUICK_ADD]",
        error
      );

      if (!cancelled) {
        setMessage(
          "Unable to load product options."
        );
      }
    });

  return () => {
    cancelled = true;
  };
}, [
  open,
  productId,
]);

const loading =
  open &&
  (!data ||
    data.productId !== productId);

    const handleClose = () => {
  if (isPending) {
    return;
  }

  setSelectedOptions({});
  setQuantity(1);
  setMessage(null);
  setSuccess(false);

  onClose();
};

  /**
   * ==========================================================
   * NORMALIZED DATA
   * ==========================================================
   */
  const activeVariantGroups = useMemo(
    () =>
      (data?.variantGroups ?? [])
        .filter(
          (group) =>
            group.options.length > 0
        )
        .sort(
          (a, b) =>
            a.sortOrder -
            b.sortOrder
        ),
    [data]
  );

  const activeSkus = useMemo(
    () =>
      (data?.skus ?? []).filter(
        (sku) =>
          sku.isActive &&
          sku.stock > 0
      ),
    [data]
  );

  /**
   * ==========================================================
   * SELECTED SKU
   * ==========================================================
   *
   * Algoritma mengikuti Product Detail:
   *
   * - tanpa variant group + satu SKU aktif
   *   => SKU otomatis dipilih
   *
   * - dengan variant group
   *   => semua group wajib dipilih
   *
   * - SKU harus mempunyai seluruh option
   *   dari active variant groups
   */
  const selectedSku = useMemo(() => {
    if (!data) {
      return null;
    }

    if (
      activeVariantGroups.length === 0
    ) {
      if (activeSkus.length === 1) {
        return activeSkus[0];
      }

      return null;
    }

    const selectedOptionIds =
      activeVariantGroups.map(
        (group) =>
          selectedOptions[group.id]
      );

    if (
      selectedOptionIds.some(
        (optionId) => !optionId
      )
    ) {
      return null;
    }

    return (
      activeSkus.find(
        (sku) => {
          const skuOptionIds =
            sku.options.map(
              (option) =>
                option.variantOptionId
            );

          if (
            skuOptionIds.length !==
            activeVariantGroups.length
          ) {
            return false;
          }

          return selectedOptionIds.every(
            (optionId) =>
              skuOptionIds.includes(
                optionId
              )
          );
        }
      ) ?? null
    );
  }, [
    data,
    activeVariantGroups,
    activeSkus,
    selectedOptions,
  ]);

  /**
   * ==========================================================
   * SELECTED SKU STOCK
   * ==========================================================
   */
  const selectedStock =
    selectedSku
      ? Math.max(
          0,
          selectedSku.stock
        )
      : 0;

  /**
   * ==========================================================
   * OPTION AVAILABILITY
   * ==========================================================
   *
   * Sebuah option hanya aktif apabila masih ada
   * SKU yang kompatibel dengan pilihan customer.
   *
   * Ini mencegah kombinasi variant yang tidak mempunyai SKU.
   */
  const isOptionAvailable = (
    groupId: string,
    optionId: string
  ) => {
    if (!data) {
      return false;
    }

    const otherSelections =
      activeVariantGroups
        .filter(
          (group) =>
            group.id !== groupId
        )
        .map(
          (group) => ({
            groupId: group.id,
            optionId:
              selectedOptions[
                group.id
              ],
          })
        )
        .filter(
          (selection) =>
            Boolean(
              selection.optionId
            )
        );

    return activeSkus.some(
      (sku) => {
        const optionIdsByGroup =
          new Map<
            string,
            string
          >();

        for (
          const option
          of sku.options
        ) {
          optionIdsByGroup.set(
            option.groupId,
            option.variantOptionId
          );
        }

        if (
          optionIdsByGroup.get(
            groupId
          ) !== optionId
        ) {
          return false;
        }

        return otherSelections.every(
          (selection) =>
            optionIdsByGroup.get(
              selection.groupId
            ) ===
            selection.optionId
        );
      }
    );
  };

  /**
   * ==========================================================
   * CHANGE OPTION
   * ==========================================================
   */
  const handleSelectOption = (
    groupId: string,
    optionId: string
  ) => {
    setMessage(null);
    setSuccess(false);
    setQuantity(1);

    setSelectedOptions(
      (current) => ({
        ...current,
        [groupId]: optionId,
      })
    );
  };

  /**
   * ==========================================================
   * QUANTITY
   * ==========================================================
   */
  const decreaseQuantity = () => {
    setQuantity(
      (current) =>
        Math.max(
          1,
          current - 1
        )
    );
  };

  const increaseQuantity = () => {
    if (!selectedSku) {
      return;
    }

    setQuantity(
      (current) =>
        Math.min(
          selectedStock,
          current + 1
        )
    );
  };

  /**
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */
  const handleAddToCart = () => {
    if (!selectedSku) {
      setMessage(
        "Silakan pilih semua varian produk."
      );

      return;
    }

    if (selectedStock <= 0) {
      setMessage(
        "Stok produk sedang habis."
      );

      return;
    }

    if (
      quantity < 1 ||
      quantity > selectedStock
    ) {
      setMessage(
        "Jumlah pembelian melebihi stok."
      );

      return;
    }

    setMessage(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const result =
          await addToCartAction({
            productId,
            skuId:
              selectedSku.id,
            quantity,
            customerNote: null,
          });

        if (!result.success) {
          setMessage(
            result.message ??
              "Gagal menambahkan produk ke keranjang."
          );

          return;
        }

        setSuccess(true);
        onAdded?.();

        /**
         * Beri sedikit waktu agar customer melihat
         * feedback berhasil sebelum sheet ditutup.
         */
window.setTimeout(() => {
  setSelectedOptions({});
  setQuantity(1);
  setMessage(null);
  setSuccess(false);
  onClose();
}, 500);
      } catch (error) {
        console.error(
          "[HOME_PRODUCT_QUICK_ADD_SUBMIT]",
          error
        );

        setMessage(
          "Terjadi kesalahan saat menambahkan produk."
        );
      }
    });
  };

  if (!open) {
    return null;
  }

  return (
    <div
    className="fixed inset-0 z-100 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={
        productName ??
        data?.productName ??
        "Pilih produk"
      }
    >
      {/* Overlay */}
<button
  type="button"
  aria-label="Tutup"
  onClick={handleClose}
  className="absolute inset-0 bg-black/45"
/>

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 pr-4">
            <h2 className="truncate text-base font-bold text-slate-900">
              {data?.productName ??
                productName ??
                "Pilih produk"}
            </h2>

<p className="mt-0.5 text-xs text-slate-500">
  {activeVariantGroups.length > 0
    ? "Pilih varian sebelum masuk keranjang"
    : "Produk siap ditambahkan ke keranjang"}
</p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
                <Loader2 className="h-7 w-7 animate-spin" />
                <span>
                  Memuat pilihan produk...
                </span>
              </div>
            </div>
          ) : message && !data ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {message}
            </div>
          ) : data ? (
            <div className="space-y-6">
              {activeVariantGroups.length ===
              0 ? (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Produk siap ditambahkan
                  </p>

                  {selectedSku ? (
                    <div className="mt-2 flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-500">
                        {selectedSku.sku}
                      </span>

                      <span className="text-base font-bold text-slate-900">
                        {formatRupiah(
                          selectedSku.price
                        )}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-red-600">
                      Produk tidak memiliki SKU aktif.
                    </p>
                  )}
                </div>
              ) : (
                activeVariantGroups.map(
                  (group) => (
                    <section
                      key={group.id}
                      className="space-y-3"
                    >
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {group.name}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {group.options.map(
                          (option) => {
                            const selected =
                              selectedOptions[
                                group.id
                              ] ===
                              option.id;

                            const available =
                              isOptionAvailable(
                                group.id,
                                option.id
                              );

                            return (
                              <button
                                key={option.id}
                                type="button"
                                disabled={
                                  !available ||
                                  isPending
                                }
                                onClick={() =>
                                  handleSelectOption(
                                    group.id,
                                    option.id
                                  )
                                }
                                className={[
                                  "relative rounded-xl border px-4 py-2.5 text-sm font-medium transition",
                                  selected
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : available
                                      ? "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                                      : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through",
                                ].join(" ")}
                              >
                                {option.label}

                                {selected ? (
                                  <Check className="ml-1.5 inline-block h-4 w-4" />
                                ) : null}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </section>
                  )
                )
              )}

              {/* Selected SKU summary */}
              <div className="rounded-2xl bg-slate-50 p-4">
                {selectedSku ? (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-slate-500">
                          Pilihan
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {selectedSku.options
                            .map(
                              (option) =>
                                option.label
                            )
                            .join(" • ") ||
                            selectedSku.sku}
                        </p>
                      </div>

                      <p className="shrink-0 text-lg font-bold text-slate-900">
                        {formatRupiah(
                          selectedSku.price
                        )}
                      </p>
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                      Stok tersedia:{" "}
                      <span className="font-semibold text-slate-700">
                        {selectedStock}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    Pilih semua varian untuk melihat harga
                    dan stok.
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Jumlah
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Maksimal sesuai stok
                  </p>
                </div>

                <div className="flex items-center rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={
                      decreaseQuantity
                    }
                    disabled={
                      !selectedSku ||
                      quantity <= 1 ||
                      isPending
                    }
                    className="flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                    aria-label="Kurangi jumlah"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <span className="flex h-10 min-w-10 items-center justify-center border-x border-slate-200 text-sm font-bold text-slate-900">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={
                      increaseQuantity
                    }
                    disabled={
                      !selectedSku ||
                      quantity >= selectedStock ||
                      isPending
                    }
                    className="flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                    aria-label="Tambah jumlah"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {message ? (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {message}
                </div>
              ) : null}

              {success ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  <Check className="h-4 w-4" />
                  Produk berhasil ditambahkan ke keranjang.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!loading && data ? (
          <div className="border-t border-slate-100 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
            <button
              type="button"
              onClick={
                handleAddToCart
              }
              disabled={
                !selectedSku ||
                selectedStock <= 0 ||
                isPending ||
                success
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
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
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  Tambah ke Keranjang
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
