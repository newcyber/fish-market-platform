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
  Minus,
  Plus,
} from "lucide-react";

import {
  FlashSaleCountdown,
} from "@/components/customer/flash-sale/FlashSaleCountdown";

import {
  addToCartAction,
} from "@/actions/cart/add-to-cart";

/**
 * ============================================================
 * PRODUCT VARIANT GROUP
 * ============================================================
 *
 * Canonical variant structure:
 *
 * Product
 *   └─ ProductVariantGroup
 *        └─ ProductVariantOption
 *
 * Contoh:
 *
 * Group: Kondisi
 *   - Utuh
 *   - Dibersihkan
 *   - Fillet
 *
 * Group: Berat
 *   - 500 Gram
 *   - 1 KG
 *   - 2 KG
 */
interface ProductVariantGroup {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  options: ProductVariantOption[];
}

/**
 * ============================================================
 * PRODUCT VARIANT OPTION
 * ============================================================
 */
interface ProductVariantOption {
  id: string;
  groupId: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

/**
 * ============================================================
 * PRODUCT SKU OPTION
 * ============================================================
 *
 * Relasi:
 *
 * ProductSkuOption.variantOptionId
 *          ↓
 * ProductVariantOption.id
 */
interface ProductSkuOption {
  id: string;
  skuId: string;
  variantOptionId: string;
}

/**
 * ============================================================
 * PRODUCT SKU
 * ============================================================
 *
 * SKU adalah canonical sellable unit.
 *
 * Harga dan stok berasal dari SKU.
 */
interface ProductSku {
  id: string;
  sku: string;
  productId: string;
  price: number;
  stock: number;
  isActive: boolean;
  skuOptions: ProductSkuOption[];
}

/**
 * ============================================================
 * FLASH SALE ITEM
 * ============================================================
 *
 * Flash Sale sekarang diarahkan ke SKU.
 */
interface ProductFlashSaleItem {
  id: string;
  skuId: string | null;
  originalPrice: number;
  flashPrice: number;
  stockLimit: number;
  soldQuantity: number;
  campaignName: string;
  endsAt: string | Date;
}

/**
 * ============================================================
 * PRODUCT DISCOUNT
 * ============================================================
 */
type ProductDiscountType =
  | "PERCENTAGE"
  | "FIXED_AMOUNT";

/**
 * ============================================================
 * PROPS
 * ============================================================
 */
interface AddToCartButtonProps {
  productId: string;

  /**
   * Fallback untuk product lama yang belum memiliki SKU.
   *
   * Untuk product yang sudah memiliki active SKU,
   * stock dan basePrice tidak lagi menjadi sumber kebenaran
   * utama.
   */
  stock?: number;
  basePrice?: number;

  /**
   * Canonical variant system.
   */
  variantGroups?: ProductVariantGroup[];

  /**
   * Canonical sellable SKUs.
   */
  skus?: ProductSku[];

  flashSaleItems?: ProductFlashSaleItem[];

  isDiscountActive?: boolean;

  discountType?:
    | ProductDiscountType
    | null;

  discountValue?:
    | number
    | null;

  discountStartAt?:
    | string
    | Date
    | null;

  discountEndAt?:
    | string
    | Date
    | null;
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

  stock = 0,
  basePrice = 0,

  variantGroups = [],
  skus = [],

  flashSaleItems = [],

  isDiscountActive = false,

  discountType = null,

  discountValue = null,

  discountStartAt = null,

  discountEndAt = null,
}: AddToCartButtonProps) {
  const router = useRouter();

  /**
   * ==========================================================
   * NORMALIZED DATA
   * ==========================================================
   */

  const activeVariantGroups = useMemo(
    () =>
      variantGroups
        .filter(
          (group) =>
            group.isActive &&
            group.options.some(
              (option) =>
                option.isActive
            )
        )
        .sort(
          (a, b) =>
            a.sortOrder -
            b.sortOrder
        ),
    [variantGroups]
  );

  const activeSkus = useMemo(
    () =>
      skus.filter(
        (sku) =>
          sku.isActive &&
          sku.productId === productId
      ),
    [skus, productId]
  );

  /**
   * ==========================================================
   * STATE
   * ==========================================================
   */

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  /**
   * selectedOptions:
   *
   * {
   *   [groupId]: optionId
   * }
   */
  const [
    selectedOptions,
    setSelectedOptions,
  ] = useState<
    Record<string, string>
  >({});

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
   * REQUIREMENT
   * ==========================================================
   */

  const requiresVariant =
    activeVariantGroups.length > 0;

  /**
   * ==========================================================
   * SELECTED SKU
   * ==========================================================
   *
   * SKU dicari berdasarkan kombinasi ProductVariantOption
   * yang dipilih customer.
   *
   * Semua active group harus memiliki pilihan.
   */
  const selectedSku =
    useMemo(() => {
      /**
       * Product tanpa active group.
       *
       * Jika hanya ada satu SKU aktif, gunakan SKU tersebut.
       */
      if (
        activeVariantGroups.length ===
        0
      ) {
        if (
          activeSkus.length === 1
        ) {
          return activeSkus[0];
        }

        return null;
      }

      /**
       * Semua group wajib dipilih.
       */
      const selectedOptionIds =
        activeVariantGroups.map(
          (group) =>
            selectedOptions[
              group.id
            ]
        );

      if (
        selectedOptionIds.some(
          (optionId) =>
            !optionId
        )
      ) {
        return null;
      }

      /**
       * Cari SKU yang memiliki seluruh
       * ProductVariantOption yang dipilih.
       */
      return (
        activeSkus.find(
          (sku) => {
            const skuOptionIds =
              sku.skuOptions.map(
                (skuOption) =>
                  skuOption.variantOptionId
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
      activeVariantGroups,
      activeSkus,
      selectedOptions,
    ]);

  /**
   * ==========================================================
   * SELECTED SKU PRICE
   * ==========================================================
   */
  const selectedSkuPrice =
    selectedSku
      ? Math.max(
          0,
          Number(
            selectedSku.price
          )
        )
      : null;

  /**
   * ==========================================================
   * ORIGINAL UNIT PRICE
   * ==========================================================
   *
   * SKU menjadi sumber harga utama.
   *
   * Product-level basePrice hanya fallback untuk
   * product lama yang belum mempunyai SKU.
   */
  const originalUnitPrice =
    selectedSkuPrice !== null
      ? selectedSkuPrice
      : Math.max(
          0,
          Number(basePrice)
        );

  /**
   * ==========================================================
   * SKU STOCK
   * ==========================================================
   */
  const currentStock =
    selectedSku
      ? Math.max(
          0,
          Number(
            selectedSku.stock
          )
        )
      : activeSkus.length > 0
        ? 0
        : Math.max(
            0,
            Number(stock)
          );

  /**
   * ==========================================================
   * CURRENT TIME
   * ==========================================================
   */
  const now =
    new Date();

  /**
   * ==========================================================
   * DISCOUNT STATUS
   * ==========================================================
   */
  const hasDiscountStarted =
    !discountStartAt ||
    new Date(
      discountStartAt
    ) <= now;

  const hasDiscountEnded =
    !!discountEndAt &&
    new Date(
      discountEndAt
    ) <= now;

  const isDiscountCurrentlyActive =
    isDiscountActive &&
    discountType !== null &&
    discountValue !== null &&
    Number(
      discountValue
    ) > 0 &&
    hasDiscountStarted &&
    !hasDiscountEnded;

  /**
   * ==========================================================
   * PRODUCT DISCOUNT
   * ==========================================================
   */
  const discountAmount =
    useMemo(() => {
      if (
        !isDiscountCurrentlyActive
      ) {
        return 0;
      }

      const value =
        Math.max(
          0,
          Number(
            discountValue
          )
        );

      if (
        discountType ===
        "PERCENTAGE"
      ) {
        const percentage =
          Math.min(
            100,
            value
          );

        return Math.min(
          originalUnitPrice,
          (
            originalUnitPrice *
            percentage
          ) / 100
        );
      }

      if (
        discountType ===
        "FIXED_AMOUNT"
      ) {
        return Math.min(
          originalUnitPrice,
          value
        );
      }

      return 0;
    }, [
      isDiscountCurrentlyActive,
      discountType,
      discountValue,
      originalUnitPrice,
    ]);

  /**
   * ==========================================================
   * ACTIVE FLASH SALE
   * ==========================================================
   *
   * Flash Sale harus mengarah ke SKU.
   *
   * Tidak lagi mencari berdasarkan weightOptionId.
   */
  const activeFlashSaleItem =
    useMemo(() => {
      if (
        !selectedSku
      ) {
        return null;
      }

      const availableItems =
        flashSaleItems.filter(
          (item) =>
            item.skuId ===
              selectedSku.id &&
            Number(
              item.stockLimit
            ) >
              Number(
                item.soldQuantity
              )
        );

      return (
        availableItems[0] ??
        null
      );
    }, [
      flashSaleItems,
      selectedSku,
    ]);

  /**
   * ==========================================================
   * FLASH SALE PRICE
   * ==========================================================
   */
  const flashSaleBasePrice =
    activeFlashSaleItem
      ? Math.max(
          0,
          Number(
            activeFlashSaleItem.flashPrice
          )
        )
      : 0;

  /**
   * ==========================================================
   * FLASH SALE APPLIED
   * ==========================================================
   */
  const isFlashSaleApplied =
    activeFlashSaleItem !==
    null;

  /**
   * ==========================================================
   * FINAL UNIT PRICE
   * ==========================================================
   *
   * Priority:
   *
   * 1. Flash Sale
   * 2. Product Discount
   * 3. Normal SKU price
   */
  const unitPrice =
    isFlashSaleApplied
      ? flashSaleBasePrice
      : Math.max(
          0,
          originalUnitPrice -
            discountAmount
        );

  /**
   * ==========================================================
   * CURRENT SAVING
   * ==========================================================
   */
  const currentOriginalPrice =
    originalUnitPrice;

  const currentSaving =
    Math.max(
      0,
      currentOriginalPrice -
        unitPrice
    );

  /**
   * ==========================================================
   * TOTAL PRICE
   * ==========================================================
   */
  const totalPrice =
    unitPrice *
    quantity;

  /**
   * ==========================================================
   * TOTAL SAVING
   * ==========================================================
   */
  const totalDiscountAmount =
    currentSaving *
    quantity;

  /**
   * ==========================================================
   * FLASH SALE REMAINING STOCK
   * ==========================================================
   */
  const flashSaleRemainingStock =
    isFlashSaleApplied &&
    activeFlashSaleItem
      ? Math.max(
          0,
          Number(
            activeFlashSaleItem.stockLimit
          ) -
            Number(
              activeFlashSaleItem.soldQuantity
            )
        )
      : null;

  /**
   * ==========================================================
   * FLASH SALE SOLD PERCENTAGE
   * ==========================================================
   */
  const flashSaleSoldPercentage =
    isFlashSaleApplied &&
    activeFlashSaleItem &&
    Number(
      activeFlashSaleItem.stockLimit
    ) > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (
              Number(
                activeFlashSaleItem.soldQuantity
              ) /
              Number(
                activeFlashSaleItem.stockLimit
              )
            ) *
              100
          )
        )
      : 0;

  /**
   * ==========================================================
   * EFFECTIVE MAX QUANTITY
   * ==========================================================
   */
  const effectiveMaxQuantity =
    flashSaleRemainingStock !==
    null
      ? Math.min(
          currentStock,
          flashSaleRemainingStock
        )
      : currentStock;

  /**
   * ==========================================================
   * STOCK STATE
   * ==========================================================
   *
   * Jika product memiliki active SKU tetapi customer
   * belum memilih kombinasi, jangan anggap stok tersedia.
   */
  const selectionIncomplete =
    requiresVariant &&
    !selectedSku;

  const outOfStock =
    selectionIncomplete ||
    currentStock <= 0;

  /**
   * ==========================================================
   * FLASH SALE SOLD OUT
   * ==========================================================
   */
  const isFlashSaleSoldOut =
    isFlashSaleApplied &&
    flashSaleRemainingStock !==
      null &&
    flashSaleRemainingStock <=
      0;

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
   * SELECT OPTION
   * ==========================================================
   */
  function selectOption(
    groupId: string,
    optionId: string
  ) {
    setSelectedOptions(
      (previous) => ({
        ...previous,
        [groupId]:
          optionId,
      })
    );

    setQuantity(
      (current) =>
        Math.max(
          1,
          Math.min(
            current,
            Math.max(
              1,
              currentStock
            )
          )
        )
    );

    resetMessage();
  }

  /**
   * ==========================================================
   * QUANTITY DECREASE
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
   * QUANTITY INCREASE
   * ==========================================================
   */
  function increase() {
    if (
      effectiveMaxQuantity <=
      0
    ) {
      setSuccess(false);

      setMessage(
        isFlashSaleApplied
          ? "Kuota Flash Sale sudah habis."
          : "Stok produk sudah habis."
      );

      return;
    }

    setQuantity(
      (current) =>
        Math.min(
          effectiveMaxQuantity,
          current + 1
        )
    );

    resetMessage();
  }

  /**
   * ==========================================================
   * OPTION AVAILABILITY
   * ==========================================================
   *
   * Menentukan apakah sebuah option mempunyai minimal satu
   * SKU yang compatible dengan pilihan group lain.
   */
  function isOptionAvailable(
    groupId: string,
    optionId: string
  ) {
    if (
      activeSkus.length ===
      0
    ) {
      return true;
    }

    return activeSkus.some(
      (sku) => {
        const skuOptionIds =
          sku.skuOptions.map(
            (item) =>
              item.variantOptionId
          );

        if (
          !skuOptionIds.includes(
            optionId
          )
        ) {
          return false;
        }

        return Object.entries(
          selectedOptions
        ).every(
          ([
            selectedGroupId,
            selectedOptionId,
          ]) => {
            if (
              selectedGroupId ===
              groupId
            ) {
              return true;
            }

            return skuOptionIds.includes(
              selectedOptionId
            );
          }
        );
      }
    );
  }

  /**
   * ==========================================================
   * VALIDATION
   * ==========================================================
   */
  function validateSelection() {
    /**
     * --------------------------------------------------------
     * VARIANT SELECTION
     * --------------------------------------------------------
     */
    if (
      requiresVariant &&
      !selectedSku
    ) {
      setSuccess(false);

      setMessage(
        "Silakan pilih semua varian produk terlebih dahulu."
      );

      return false;
    }

    /**
     * --------------------------------------------------------
     * SKU ACTIVE VALIDATION
     * --------------------------------------------------------
     */
    if (
      activeSkus.length > 0 &&
      !selectedSku
    ) {
      setSuccess(false);

      setMessage(
        "Kombinasi varian produk tidak tersedia."
      );

      return false;
    }

    /**
     * --------------------------------------------------------
     * STOCK
     * --------------------------------------------------------
     */
    if (
      currentStock <= 0
    ) {
      setSuccess(false);

      setMessage(
        "Produk untuk pilihan ini sedang habis."
      );

      return false;
    }

    /**
     * --------------------------------------------------------
     * FLASH SALE
     * --------------------------------------------------------
     */
    if (
      isFlashSaleSoldOut
    ) {
      setSuccess(false);

      setMessage(
        "Maaf, kuota Flash Sale untuk pilihan ini sudah habis."
      );

      return false;
    }

    /**
     * --------------------------------------------------------
     * QUANTITY
     * --------------------------------------------------------
     */
    if (
      quantity < 1
    ) {
      setSuccess(false);

      setMessage(
        "Jumlah produk minimal 1."
      );

      return false;
    }

    /**
     * --------------------------------------------------------
     * MAX QUANTITY
     * --------------------------------------------------------
     */
    if (
      quantity >
      effectiveMaxQuantity
    ) {
      setSuccess(false);

      setMessage(
        isFlashSaleApplied
          ? `Kuota Flash Sale tersisa ${effectiveMaxQuantity} produk.`
          : `Jumlah maksimal ${effectiveMaxQuantity} produk.`
      );

      return false;
    }

    return true;
  }

  /**
   * ==========================================================
   * SUBMIT PRODUCT
   * ==========================================================
   */
  function submitProduct(
  buyNow = false
) {
  if (isPending) {
    return;
  }

  if (!validateSelection()) {
    return;
  }

  /**
   * Setelah validateSelection():
   * - Jika product memiliki SKU aktif,
   *   selectedSku wajib tersedia.
   */
  if (activeSkus.length > 0 && !selectedSku) {
    setSuccess(false);
    setMessage(
      "SKU produk tidak ditemukan."
    );
    return;
  }

  resetMessage();

  startTransition(
    async () => {
      const result =
        await addToCartAction({
          productId,

          skuId:
            selectedSku?.id ?? "",

          quantity,

          customerNote:
            customerNote.trim() ||
            null,
        });

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

      window.dispatchEvent(
        new Event("cart-updated")
      );

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

      <div>
        {isFlashSaleApplied &&
        activeFlashSaleItem ? (

          <div className="overflow-hidden border-y border-orange-100 bg-[#fff4f1]">

            {/* FLASH SALE HEADER */}

            <div
              className="
                flex
                flex-col
                gap-3
                bg-linear-to-r
                from-[#00a0fc]
                to-[#39eaf7]
                px-5
                py-3
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >

              <div className="flex items-center gap-2">

                <span
                  className="
                    text-base
                    font-black
                    italic
                    tracking-wide
                    text-white
                    sm:text-lg
                  "
                >
                  ⚡ FLASH SALE
                </span>

                {currentSaving >
                  0 &&
                  currentOriginalPrice >
                    0 && (
                    <span
                      className="
                        rounded
                        bg-white/20
                        px-2
                        py-1
                        text-xs
                        font-bold
                        text-white
                      "
                    >
                      -
                      {Math.round(
                        (
                          currentSaving /
                          currentOriginalPrice
                        ) *
                          100
                      )}
                      %
                    </span>
                  )}

              </div>

              {/* COUNTDOWN */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                  sm:justify-end
                "
              >

                <span
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-white
                  "
                >
                  Berakhir Dalam
                </span>

                <FlashSaleCountdown
                  endsAt={
                    activeFlashSaleItem.endsAt
                  }
                />

              </div>

            </div>

            {/* FLASH SALE CONTENT */}

            <div className="px-5 py-4">

              <p
                className="
                  mb-3
                  text-xs
                  font-medium
                  text-slate-500
                "
              >
                {
                  activeFlashSaleItem.campaignName
                }
              </p>

              {/* FLASH SALE STOCK */}

              {flashSaleRemainingStock !==
                null && (
                <div
                  className="
                    mb-4
                    rounded-lg
                    border
                    border-orange-100
                    bg-white/70
                    p-3
                  "
                >

                  <div
                    className="
                      mb-2
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >

                    <span
                      className="
                        text-xs
                        font-semibold
                        text-slate-700
                      "
                    >
                      Stok promo terbatas
                    </span>

                    <span
                      className="
                        text-xs
                        font-bold
                        text-[#ee4d2d]
                      "
                    >
                      Sisa{" "}
                      {
                        flashSaleRemainingStock
                      }
                    </span>

                  </div>

                  <div
                    className="
                      h-2.5
                      w-full
                      overflow-hidden
                      rounded-full
                      bg-orange-100
                    "
                  >

                    <div
                      className="
                        h-full
                        rounded-full
                        bg-linear-to-r
                        from-[#2d99ff]
                        to-[#4cccff]
                        transition-all
                        duration-500
                      "
                      style={{
                        width:
                          `${flashSaleSoldPercentage}%`,
                      }}
                    />

                  </div>

                  <div
                    className="
                      mt-2
                      flex
                      flex-wrap
                      items-center
                      justify-between
                      gap-2
                      text-[11px]
                    "
                  >

                    <span
                      className="
                        font-medium
                        text-slate-500
                      "
                    >
                      Terjual{" "}

                      <span className="font-bold text-slate-700">
                        {
                          activeFlashSaleItem.soldQuantity
                        }
                      </span>

                      {" dari "}

                      <span className="font-bold text-slate-700">
                        {
                          activeFlashSaleItem.stockLimit
                        }
                      </span>
                    </span>

                    {isFlashSaleSoldOut ? (

                      <span
                        className="
                          rounded
                          bg-red-100
                          px-2
                          py-1
                          font-bold
                          text-red-600
                        "
                      >
                        SOLD OUT
                      </span>

                    ) : flashSaleSoldPercentage >=
                      80 ? (

                      <span className="font-semibold text-[#ee4d2d]">
                        Hampir habis!
                      </span>

                    ) : null}

                  </div>

                </div>
              )}

              {/* PRICE */}

              <div
                className="
                  flex
                  flex-wrap
                  items-end
                  gap-3
                "
              >

                <span
                  className="
                    text-2xl
                    font-bold
                    tracking-tight
                    text-[#ee4d2d]
                    sm:text-3xl
                  "
                >
                  {formatRupiah(
                    unitPrice
                  )}
                </span>

                <span
                  className="
                    pb-1
                    text-sm
                    text-slate-400
                    line-through
                  "
                >
                  {formatRupiah(
                    currentOriginalPrice
                  )}
                </span>

              </div>

              {currentSaving >
                0 && (
                <div
                  className="
                    mt-2
                    text-xs
                    font-semibold
                    text-red-600
                  "
                >
                  Hemat{" "}
                  {formatRupiah(
                    currentSaving
                  )}
                  {" / produk"}
                </div>
              )}

            </div>

          </div>

        ) : (

          <div className="border-y border-slate-200 bg-slate-50 px-5 py-4">

            <p
              className="
                text-[11px]
                font-medium
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Harga Produk
            </p>

            {isDiscountCurrentlyActive ? (

              <>

                <div
                  className="
                    mt-1
                    flex
                    flex-wrap
                    items-center
                    gap-2
                  "
                >

                  <span
                    className="
                      text-base
                      text-slate-400
                      line-through
                    "
                  >
                    {formatRupiah(
                      originalUnitPrice
                    )}
                  </span>

                  <span
                    className="
                      rounded-md
                      bg-red-100
                      px-2
                      py-1
                      text-xs
                      font-semibold
                      text-red-600
                    "
                  >
                    {discountType ===
                    "PERCENTAGE"
                      ? `${Math.min(
                          100,
                          Number(
                            discountValue
                          )
                        )}%`
                      : "DISKON"}
                  </span>

                </div>

                <div
                  className="
                    mt-1
                    text-2xl
                    font-bold
                    tracking-tight
                    text-cyan-700
                    sm:text-3xl
                  "
                >
                  {formatRupiah(
                    unitPrice
                  )}
                </div>

                <p
                  className="
                    mt-1
                    text-xs
                    font-medium
                    text-emerald-600
                  "
                >
                  Hemat{" "}
                  {formatRupiah(
                    discountAmount
                  )}
                  {" / produk"}
                </p>

              </>

            ) : (

              <div
                className="
                  mt-1
                  text-2xl
                  font-bold
                  tracking-tight
                  text-slate-950
                  sm:text-3xl
                "
              >
                {formatRupiah(
                  originalUnitPrice
                )}
              </div>

            )}

          </div>

        )}

      </div>

      {/* ====================================================== */}
      {/* VARIANT GROUPS */}
      {/* ====================================================== */}

      {activeVariantGroups.map(
        (group) => {

          const activeOptions =
            group.options
              .filter(
                (option) =>
                  option.isActive
              )
              .sort(
                (a, b) =>
                  a.sortOrder -
                  b.sortOrder
              );

          if (
            activeOptions.length ===
            0
          ) {
            return null;
          }

          return (
            <div
              key={group.id}
              className="
                grid
                gap-3
                sm:grid-cols-[130px_minmax(0,1fr)]
              "
            >

              <div>

                <h3 className="text-sm text-slate-500">
                  {group.name}
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Pilih{" "}
                  {group.name.toLowerCase()}.
                </p>

              </div>

              <div className="flex flex-wrap gap-2">

                {activeOptions.map(
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
                        onClick={() =>
                          selectOption(
                            group.id,
                            option.id
                          )
                        }
                        disabled={
                          isPending ||
                          !available
                        }
                        className={[
                          "min-h-13.5 rounded-xl border px-4 py-2 text-sm transition",

                          selected
                            ? "border-cyan-600 bg-cyan-50 text-cyan-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-slate-50",

                          !available ||
                          isPending
                            ? "cursor-not-allowed opacity-50"
                            : "",
                        ].join(" ")}
                      >
                        <div className="font-medium">
                          {
                            option.label
                          }
                        </div>
                      </button>
                    );
                  }
                )}

              </div>

            </div>
          );
        }
      )}

      {/* ====================================================== */}
      {/* SELECTED SKU INFO */}
      {/* ====================================================== */}

      {selectedSku && (
        <div
          className="
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            px-4
            py-3
          "
        >
          <div className="flex flex-wrap items-center justify-between gap-2">

            <span className="text-xs text-slate-500">
              SKU
            </span>

            <span className="text-xs font-semibold text-slate-700">
              {selectedSku.sku}
            </span>

          </div>

          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">

            <span className="text-xs text-slate-500">
              Stok varian
            </span>

            <span className="text-xs font-semibold text-slate-700">
              {currentStock}
            </span>

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
            rows={3}
            maxLength={500}
            placeholder="Contoh: Tolong ikan dipotong sesuai kebutuhan."
            className="
              w-full
              resize-none
              border
              border-slate-200
              bg-white
              px-4
              py-3
              text-sm
              text-slate-900
              outline-none
              transition
              placeholder:text-slate-400
              focus:border-cyan-500
              disabled:cursor-not-allowed
              disabled:bg-slate-100
            "
          />

          <div className="mt-1 text-right text-[10px] text-slate-400">
            {
              customerNote.length
            }
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

              outOfStock ||
              isFlashSaleSoldOut
                ? "border-slate-200 opacity-60"
                : "border-slate-300",
            ].join(" ")}
          >

            <button
              type="button"
              onClick={
                decrease
              }
              disabled={
                outOfStock ||
                isFlashSaleSoldOut ||
                isPending ||
                quantity <= 1
              }
              className="
                flex
                h-full
                w-10
                items-center
                justify-center
                border-r
                border-slate-200
                text-slate-500
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
              aria-label="Kurangi jumlah"
            >
              <Minus className="h-4 w-4" />
            </button>

            <span className="flex h-full min-w-12 items-center justify-center text-sm font-medium text-slate-900">
              {
                quantity
              }
            </span>

            <button
              type="button"
              onClick={
                increase
              }
              disabled={
                outOfStock ||
                isFlashSaleSoldOut ||
                isPending ||
                effectiveMaxQuantity <=
                  0 ||
                quantity >=
                  effectiveMaxQuantity
              }
              className="
                flex
                h-full
                w-10
                items-center
                justify-center
                border-l
                border-slate-200
                text-slate-500
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
              aria-label="Tambah jumlah"
            >
              <Plus className="h-4 w-4" />
            </button>

          </div>

          {!outOfStock && (
            <span className="text-xs text-slate-400">
              {isFlashSaleApplied &&
              flashSaleRemainingStock !==
                null
                ? flashSaleRemainingStock <=
                  0
                  ? "Kuota Flash Sale habis"
                  : `${flashSaleRemainingStock} kuota Flash Sale tersisa`
                : `${currentStock} tersedia`}
            </span>
          )}

        </div>

      </div>

      {/* ====================================================== */}
      {/* PRICE SUMMARY */}
      {/* ====================================================== */}

      <div
        className="
          mt-6
          rounded-2xl
          border
          border-slate-200
          bg-slate-50
          p-4
        "
      >

        <div className="space-y-3">

          {/* NORMAL PRICE */}

          {currentSaving > 0 && (
            <div
              className="
                flex
                items-center
                justify-between
                gap-4
              "
            >

              <span className="text-sm text-slate-500">
                Harga normal
              </span>

              <span className="text-sm text-slate-400 line-through">
                {formatRupiah(
                  originalUnitPrice
                )}
              </span>

            </div>
          )}

          {/* FINAL PRICE */}

          <div
            className="
              flex
              items-center
              justify-between
              gap-4
            "
          >

            <span
              className="
                text-sm
                font-medium
                text-slate-600
              "
            >
              {isFlashSaleApplied
                ? "Harga Flash Sale"
                : currentSaving > 0
                  ? "Harga setelah diskon"
                  : "Harga"}
            </span>

            <span
              className={[
                "text-xl font-bold",

                isFlashSaleApplied
                  ? "text-red-600"
                  : "text-slate-900",
              ].join(" ")}
            >
              {formatRupiah(
                unitPrice
              )}
            </span>

          </div>

          {/* SAVING */}

          {currentSaving > 0 && (
            <div
              className="
                flex
                items-center
                justify-between
                gap-4
              "
            >

              <span className="text-sm text-slate-500">
                Hemat
              </span>

              <span className="text-sm font-semibold text-emerald-600">
                {formatRupiah(
                  currentSaving
                )}
              </span>

            </div>
          )}

          {/* TOTAL */}

          {quantity > 1 && (
            <div
              className="
                border-t
                border-slate-200
                pt-3
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >

                <span
                  className="
                    text-sm
                    font-medium
                    text-slate-600
                  "
                >
                  Total ({quantity} produk)
                </span>

                <span
                  className={[
                    "text-lg font-bold",

                    isFlashSaleApplied
                      ? "text-red-600"
                      : "text-slate-900",
                  ].join(" ")}
                >
                  {formatRupiah(
                    totalPrice
                  )}
                </span>

              </div>

              {totalDiscountAmount >
                0 && (
                <p
                  className="
                    mt-1
                    text-right
                    text-xs
                    font-medium
                    text-emerald-600
                  "
                >
                  Total hemat{" "}
                  {formatRupiah(
                    totalDiscountAmount
                  )}
                </p>
              )}

            </div>
          )}

        </div>

      </div>

      {/* ====================================================== */}
      {/* ACTION BUTTONS */}
      {/* ====================================================== */}

      <div className="border-t border-slate-200 pt-6">

        <div className="grid gap-3 sm:grid-cols-2">

          {/* ADD TO CART */}

          <button
            type="button"
            onClick={() =>
              submitProduct(
                false
              )
            }
            disabled={
              outOfStock ||
              isFlashSaleSoldOut ||
              isPending ||
              effectiveMaxQuantity <=
                0
            }
            className={[
              "flex min-h-12 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition",

              outOfStock ||
              isFlashSaleSoldOut ||
              isPending ||
              effectiveMaxQuantity <=
                0
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : "border-cyan-600 bg-white text-cyan-700 hover:bg-cyan-50 active:scale-[0.99]",
            ].join(" ")}
          >

            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

                Memproses...
              </>
            ) : isFlashSaleSoldOut ? (
              "Kuota Flash Sale Habis"
            ) : selectionIncomplete ? (
              "Pilih Varian"
            ) : outOfStock ? (
              "Produk Habis"
            ) : (
              "Tambah ke Keranjang"
            )}

          </button>

          {/* BUY NOW */}

          <button
            type="button"
            onClick={() =>
              submitProduct(
                true
              )
            }
            disabled={
              outOfStock ||
              isFlashSaleSoldOut ||
              isPending ||
              effectiveMaxQuantity <=
                0
            }
            className={[
              "flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition",

              outOfStock ||
              isFlashSaleSoldOut ||
              isPending ||
              effectiveMaxQuantity <=
                0
                ? "cursor-not-allowed bg-slate-300 text-slate-500"
                : isFlashSaleApplied
                  ? "bg-blue-600 shadow-sm hover:bg-blue-700 active:scale-[0.99]"
                  : "bg-cyan-600 shadow-sm hover:bg-cyan-700 active:scale-[0.99]",
            ].join(" ")}
          >

            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

                Memproses...
              </>
            ) : isFlashSaleSoldOut ? (
              "Kuota Flash Sale Habis"
            ) : selectionIncomplete ? (
              "Pilih Varian"
            ) : outOfStock ? (
              "Produk Habis"
            ) : (
              "Beli Sekarang"
            )}

          </button>

        </div>

        {/* ACTION HELPER */}

        {!outOfStock &&
          !isFlashSaleSoldOut &&
          effectiveMaxQuantity >
            0 && (
            <p className="mt-3 text-center text-xs text-slate-400">
              {isFlashSaleApplied
                ? `Maksimal ${effectiveMaxQuantity} produk sesuai kuota Flash Sale.`
                : `Maksimal ${effectiveMaxQuantity} produk dapat dibeli.`}
            </p>
          )}

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
          ].join(" ")}
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
