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
  Clock3,
  Flame,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Zap,
} from "lucide-react";

import {
  FlashSaleCountdown,
} from "@/components/customer/flash-sale/FlashSaleCountdown";

import {
  addToCartAction,
} from "@/actions/cart/add-to-cart";

import {
  emitCartUpdated,
} from "@/lib/cart/cart-events";

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
  perUserLimit: number | null;
  userPurchasedQuantity: number;
  campaignId: string;
  campaignName: string;
  endsAt: string | Date;
}

/**
 * Server-resolved pricing for each active SKU.
 * Product detail uses this as the display source so the selected
 * variant shows the same effective price as Cart/Checkout.
 */
interface ProductSkuPricing {
  skuId: string;
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  isDiscountApplied: boolean;
  isFlashSaleApplied: boolean;
  promotionDiscountApplied: boolean;
  promotionId: string | null;
  promotionName: string | null;
  flashSaleName: string | null;
  discountSource: "NONE" | "PRODUCT_DISCOUNT" | "PROMOTION" | "FLASH_SALE";
  flashSaleItemId: string | null;
  flashSaleId: string | null;
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

  isPreOrder?: boolean;
  preOrderMinDays?: number | null;
  preOrderMaxDays?: number | null;

  /**
   * Canonical variant system.
   */
  variantGroups?: ProductVariantGroup[];

  /**
   * Canonical sellable SKUs.
   */
  skus?: ProductSku[];

  skuPricing?: ProductSkuPricing[];

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

  isPreOrder = false,
  preOrderMinDays = null,
  preOrderMaxDays = null,

  variantGroups = [],
  skus = [],
  skuPricing = [],

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
  const preferredSkuForFlashSale = useMemo(() => {
    if (flashSaleItems.length === 0 || activeSkus.length === 0) {
      return null;
    }

    const activeFlashSkuIds = new Set(
      flashSaleItems
        .filter(
          (item) =>
            Number(item.stockLimit) > Number(item.soldQuantity) &&
            item.skuId !== null,
        )
        .map((item) => item.skuId as string),
    );

    return (
      activeSkus.find(
        (sku) =>
          activeFlashSkuIds.has(sku.id) &&
          (isPreOrder || Number(sku.stock) > 0),
      ) ?? null
    );
  }, [
    activeSkus,
    flashSaleItems,
    isPreOrder,
  ]);

  const defaultSkuForDisplay = useMemo(() => {
    if (preferredSkuForFlashSale) {
      return preferredSkuForFlashSale;
    }

    if (flashSaleItems.length === 0) {
      return null;
    }

    return (
      activeSkus.find(
        (sku) =>
          isPreOrder || Number(sku.stock) > 0,
      ) ?? null
    );
  }, [
    activeSkus,
    flashSaleItems.length,
    isPreOrder,
    preferredSkuForFlashSale,
  ]);

  const initialSelectedOptions = useMemo(() => {
    if (!defaultSkuForDisplay || activeVariantGroups.length === 0) {
      return {};
    }

    const skuOptionIds = new Set(
      defaultSkuForDisplay.skuOptions.map(
        (skuOption) => skuOption.variantOptionId,
      ),
    );

    return Object.fromEntries(
      activeVariantGroups
        .map((group) => {
          const option = group.options.find((item) =>
            skuOptionIds.has(item.id),
          );

          return option ? [group.id, option.id] : null;
        })
        .filter(
          (entry): entry is [string, string] => entry !== null,
        ),
    );
  }, [
    activeVariantGroups,
    defaultSkuForDisplay,
  ]);

  const [
    selectedOptions,
    setSelectedOptions,
  ] = useState<Record<string, string>>(
    initialSelectedOptions,
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
   * SELECTED SKU PRICING
   * ==========================================================
   *
   * Harga efektif sudah di-resolve server-side oleh
   * ProductPricingService. Ini adalah sumber display untuk SKU
   * agar Promo Price per-SKU tidak hilang di detail produk.
   */
  const selectedSkuPricing =
    selectedSku
      ? skuPricing.find(
          (pricing) =>
            pricing.skuId === selectedSku.id
        ) ?? null
      : null;

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
   * Server-resolved SKU pricing wins when available.
   * Product-level basePrice remains fallback for legacy products.
   */
  const originalUnitPrice =
    selectedSkuPricing
      ? Math.max(
          0,
          Number(
            selectedSkuPricing.originalPrice
          )
        )
      : selectedSkuPrice !== null
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
   * FLASH SALE ELIGIBILITY — ALL OR NOTHING
   * ==========================================================
   *
   * Qty <= remaining promo rights + remaining global quota
   *     -> seluruh qty harga Flash Sale
   * Qty > salah satu limit
   *     -> seluruh qty harga normal
   *
   * Tidak ada split price dalam satu SKU.
   */
  const flashSaleRemainingCustomerLimit =
    activeFlashSaleItem?.perUserLimit !== null &&
    activeFlashSaleItem
      ? Math.max(
          0,
          Number(activeFlashSaleItem.perUserLimit) -
            Number(activeFlashSaleItem.userPurchasedQuantity ?? 0)
        )
      : Number.MAX_SAFE_INTEGER;

  const flashSaleEligibleQuantity =
    activeFlashSaleItem
      ? Math.min(
          activeFlashSaleItem
            ? Math.max(
                0,
                Number(activeFlashSaleItem.stockLimit) -
                  Number(activeFlashSaleItem.soldQuantity)
              )
            : 0,
          flashSaleRemainingCustomerLimit
        )
      : 0;

  const isFlashSaleApplied =
    activeFlashSaleItem !== null &&
    quantity <= flashSaleEligibleQuantity &&
    flashSaleEligibleQuantity > 0;

  const normalUnitPrice =
    selectedSkuPricing?.isFlashSaleApplied
      ? originalUnitPrice
      : selectedSkuPricing
        ? Math.max(
            0,
            Number(selectedSkuPricing.finalPrice)
          )
        : Math.max(
            0,
            originalUnitPrice - discountAmount
          );

  /**
   * ==========================================================
   * FINAL UNIT PRICE
   * ==========================================================
   */
  const unitPrice =
    isFlashSaleApplied
      ? flashSaleBasePrice
      : normalUnitPrice;

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


  const flashSaleRemainingPercentage =
    isFlashSaleApplied && activeFlashSaleItem && Number(activeFlashSaleItem.stockLimit) > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (Number(activeFlashSaleItem.stockLimit) -
              Number(activeFlashSaleItem.soldQuantity)) /
              Number(activeFlashSaleItem.stockLimit) *
              100,
          ),
        )
      : 0;

  const flashSaleSaving = isFlashSaleApplied && activeFlashSaleItem
    ? Math.max(
        0,
        Number(activeFlashSaleItem.originalPrice) -
          Number(activeFlashSaleItem.flashPrice),
      )
    : 0;

  const flashSaleDiscountPercentage =
    isFlashSaleApplied && activeFlashSaleItem && Number(activeFlashSaleItem.originalPrice) > 0
      ? Math.round(
          (flashSaleSaving / Number(activeFlashSaleItem.originalPrice)) * 100,
        )
      : 0;

  const selectedVariantSummary = activeVariantGroups
    .map((group) => {
      const selectedOptionId = selectedOptions[group.id];
      return group.options.find((option) => option.id === selectedOptionId)?.label ?? null;
    })
    .filter((label): label is string => Boolean(label))
    .join(' • ');

  /**
   * ==========================================================
   * EFFECTIVE MAX QUANTITY
   * ==========================================================
   */
const effectiveMaxQuantity =
  isPreOrder
    ? Number.MAX_SAFE_INTEGER
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
  (!isPreOrder && currentStock <= 0);

  /**
   * ==========================================================
   * FLASH SALE SOLD OUT
   * ==========================================================
   */
  const isFlashSaleSoldOut = false;

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
    isPreOrder
      ? Math.max(1, current)
      : Math.max(
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

        /**
         * Option harus memang dimiliki SKU ini.
         */
        if (
          !skuOptionIds.includes(
            optionId
          )
        ) {
          return false;
        }

        /**
         * SKU yang stoknya habis tidak boleh membuat
         * option terlihat tersedia.
         *
         * Untuk Pre-Order, stock 0 tetap dianggap tersedia.
         */
        if (
          !isPreOrder &&
          Number(sku.stock) <= 0
        ) {
          return false;
        }

        /**
         * SKU harus compatible dengan pilihan pada
         * group lain yang sudah dipilih customer.
         */
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
  !isPreOrder &&
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

        emitCartUpdated();

      if (buyNow) {
  /**
   * ========================================================
   * BUY NOW
   * ========================================================
   *
   * Customer yang sudah login:
   * langsung menuju checkout dengan CartItem yang
   * baru saja dibuat / diperbarui.
   *
   * Guest:
   * tetap menuju cart karena checkout membutuhkan
   * authenticated customer.
   */
  if (
    !result.isGuest &&
    result.cartItemId
  ) {
    router.push(
      `/customer/checkout?selected=${encodeURIComponent(
        result.cartItemId
      )}`
    );

    router.refresh();

    return;
  }

  /**
   * Guest tetap masuk ke cart.
   */
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
    <div className="w-full space-y-3">

      {/* ====================================================== */}
      {/* ACTIVE PRICE PANEL */}
      {/* ====================================================== */}

      {selectedSku && flashSaleItems.length > 0 && !isFlashSaleApplied && (
        <section
          className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5"
          aria-label="Harga normal"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Harga Normal
          </p>
          <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className="text-3xl font-black tracking-tight text-[#075bb5] sm:text-4xl">
              {formatRupiah(normalUnitPrice)}
            </span>
          </div>
        </section>
      )}

      {/* ====================================================== */}
      {/* FLASH SALE */}
      {/* ====================================================== */}

      {isFlashSaleApplied && activeFlashSaleItem && (
        <section
          className="overflow-hidden rounded-2xl border border-cyan-200 bg-white shadow-sm"
          aria-label="Flash Sale"
        >
          <div className="bg-linear-to-br from-[#0877df] via-[#0b8ff2] to-[#35d8f4] px-4 py-3.5 text-white sm:px-5 sm:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white shadow-sm">
                    <Zap className="h-5 w-5 fill-current" />
                  </span>
                  <div>
                    <p className="text-xl font-black italic tracking-wide sm:text-[25px]">FLASH SALE</p>
                    <p className="mt-0.5 text-xs font-medium text-white/85">
                      Kesempatan terbatas! Dapatkan sekarang sebelum kehabisan!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-950/35 px-3 py-2 sm:px-3.5">
                <Clock3 className="h-4 w-4 text-white/90" />
                <FlashSaleCountdown endsAt={activeFlashSaleItem.endsAt} />
              </div>
            </div>
          </div>

          <div className="bg-linear-to-b from-cyan-50/90 to-white px-4 py-4 sm:px-5 sm:py-4.5">
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1.5">
              <span className="text-3xl font-black tracking-tight text-[#075bb5] sm:text-4xl">
                {formatRupiah(unitPrice)}
              </span>
              <span className="pb-1 text-base font-medium text-slate-500 line-through sm:text-lg">
                {formatRupiah(Number(activeFlashSaleItem.originalPrice))}
              </span>
              <span className="mb-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-600">
                -{flashSaleDiscountPercentage}%
              </span>
            </div>

            <p className="mt-1 text-base font-bold text-emerald-600 sm:text-lg">
              Hemat {formatRupiah(flashSaleSaving)}
            </p>

            <div className="mt-3.5">
              <div className="mb-1.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1.5 font-bold text-rose-600">
                  <Flame className="h-4 w-4 fill-current" />
                  Tersisa {flashSaleRemainingStock} dari {activeFlashSaleItem.stockLimit} kuota promo
                </span>
                <span className="font-bold text-slate-500">
                  {Math.round(flashSaleRemainingPercentage)}%
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#1687e8] transition-all duration-500"
                  style={{ width: `${flashSaleRemainingPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

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
                gap-2
                sm:grid-cols-[130px_minmax(0,1fr)]
              "
            >

              <div>

                <h3 className="text-sm text-slate-500">
                  {group.name}
                </h3>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Pilih{" "}
                  {group.name.toLowerCase()}.
                </p>

              </div>

              <div className="flex flex-wrap gap-1.5">

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
                          "min-h-10 rounded-xl border px-3 py-1.5 text-sm transition",

                          selected
                            ? "border-cyan-600 bg-cyan-50 text-cyan-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-slate-50",

                          !available ||
                          isPending
                            ? "cursor-not-allowed opacity-50"
                            : "",
                          !available
                            ? "line-through decoration-1"
                            : "",
                        ].join(" ")}
                      >
                        <div
                          className={[
                            "font-medium",
                            !available
                              ? "line-through decoration-1"
                              : "",
                          ].join(" ")}
                        >
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

      {selectedSku && (
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 sm:px-4.5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-600 shadow-sm ring-1 ring-cyan-100">
              <Package className="h-5 w-5" />
            </span>

            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">Varian terpilih</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {selectedVariantSummary || "Varian terpilih"}
              </p>
            </div>
          </div>

          {isFlashSaleApplied ? (
            <div className="mt-2 ml-12 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
              <Zap className="h-3.5 w-3.5 fill-current" />
              Flash Sale aktif untuk varian ini
            </div>
          ) : originalUnitPrice > unitPrice ? (
            <p className="mt-1 ml-12 text-xs font-semibold text-emerald-600">
              Hemat {formatRupiah(currentSaving)}
            </p>
          ) : null}
        </div>
      )}

      {/* ====================================================== */}
      {/* CUSTOMER NOTE */}
      {/* ====================================================== */}

      <div className="grid gap-2 sm:grid-cols-[130px_minmax(0,1fr)]">

        <div>

          <label
            htmlFor="customer-note"
            className="block text-sm text-slate-500"
          >
            Catatan Pesanan
          </label>
          <span className="mt-0.5 block text-xs text-slate-400">
            (opsional)
          </span>

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
            rows={2}
            maxLength={120}
            placeholder="Contoh: Potong 4 bagian, kepala jangan dibuang"
            className="
              w-full
              resize-none
              rounded-xl
              border
              border-slate-200
              bg-slate-50/60
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

          <div className="mt-0.5 text-right text-[10px] text-slate-400">
            {customerNote.length}/120
          </div>

        </div>

      </div>

      {/* ====================================================== */}
      {/* QUANTITY */}
      {/* ====================================================== */}

      <div className="grid gap-3 border-t border-slate-100 pt-2.5 sm:grid-cols-[130px_minmax(0,1fr)]">

        <div className="text-sm text-slate-500">
          Kuantitas
        </div>

        <div className="flex flex-wrap items-center gap-2">

          <div
            className={[
              "flex h-10 items-center overflow-hidden rounded-xl border bg-white",

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

            <span className="flex h-full min-w-12 items-center justify-center text-sm font-semibold text-slate-900">
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
              {isFlashSaleApplied
                ? `${flashSaleRemainingStock ?? 0} kuota Flash Sale tersisa`
                : `${currentStock} tersedia`}
            </span>
          )}

        </div>

      </div>

      {/* ====================================================== */}
      {/* TOTAL PRICE */}
      {/* ====================================================== */}

      <div className="rounded-xl bg-cyan-50 px-3.5 py-3 ring-1 ring-cyan-100 sm:px-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="block text-base font-bold text-[#075bb5]">Total Harga</span>
            <span className="text-xs text-slate-500">
              {quantity} × {selectedVariantSummary || "produk"}
            </span>
          </div>
          <span className="text-2xl font-black tracking-tight text-[#075bb5] sm:text-3xl">
            {formatRupiah(totalPrice)}
          </span>
        </div>

        {totalDiscountAmount > 0 && (
          <p className="mt-1 text-right text-xs font-medium text-emerald-600">
            Total hemat {formatRupiah(totalDiscountAmount)}
          </p>
        )}
      </div>

      {/* ====================================================== */}
      {/* PRIMARY ACTION */}
      {/* ====================================================== */}

      <div className="border-t border-slate-100 pt-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => submitProduct(false)}
            disabled={
              outOfStock ||
              isFlashSaleSoldOut ||
              isPending ||
              effectiveMaxQuantity <= 0
            }
            className={[
              "flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-cyan-600 px-2 py-2.5 text-sm font-bold text-cyan-700 transition active:scale-[0.99]",
              outOfStock || isFlashSaleSoldOut || isPending || effectiveMaxQuantity <= 0
                ? "cursor-not-allowed border-slate-200 text-slate-400"
                : "bg-white hover:bg-cyan-50",
            ].join(" ")}
          >
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
            {isPending ? "Memproses..." : selectionIncomplete ? "Pilih Varian" : "Masukkan Keranjang"}
          </button>

          <button
            type="button"
            onClick={() => submitProduct(true)}
            disabled={
              outOfStock ||
              isFlashSaleSoldOut ||
              isPending ||
              effectiveMaxQuantity <= 0
            }
            className={[
              "flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-sm font-bold text-white shadow-sm transition active:scale-[0.99]",
              outOfStock || isFlashSaleSoldOut || isPending || effectiveMaxQuantity <= 0
                ? "cursor-not-allowed bg-slate-300"
                : "bg-cyan-600 hover:bg-cyan-700",
            ].join(" ")}
          >
            <Zap className="h-4 w-4 fill-current sm:h-5 sm:w-5" />
            {isPending ? "Memproses..." : isFlashSaleSoldOut ? "Kuota Habis" : selectionIncomplete ? "Pilih Varian" : outOfStock ? "Produk Habis" : "Beli Sekarang"}
          </button>
        </div>

        {!outOfStock && !isFlashSaleSoldOut && effectiveMaxQuantity > 0 && (
          <p className="mt-1 text-center text-[10px] text-slate-400">
            {isFlashSaleApplied
              ? `Maksimal ${effectiveMaxQuantity} produk sesuai kuota Flash Sale.`
              : isPreOrder
                ? "Jumlah Pre-Order tidak dibatasi stok tersedia."
                : `${effectiveMaxQuantity} stok tersedia.`}
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
