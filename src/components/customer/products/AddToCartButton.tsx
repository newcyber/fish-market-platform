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
 * FLASH SALE ITEM
 * ============================================================
 */

interface ProductFlashSaleItem {
  id: string;

  weightOptionId:
    | string
    | null;

  originalPrice: number;

  flashPrice: number;

  stockLimit: number;

  soldQuantity: number;

  campaignName: string;

  endsAt:
    | string
    | Date;
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

  stock: number;

  basePrice: number;

  variantOptions?: ProductVariantOption[];

  weightOptions?: ProductWeightOption[];

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
  stock,
  basePrice,
  variantOptions = [],
  weightOptions = [],
  flashSaleItems = [],

  isDiscountActive = false,
  discountType = null,
  discountValue = null,
  discountStartAt = null,
  discountEndAt = null,
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
 * RESOLVE ACTIVE FLASH SALE
 * ==========================================================
 *
 * Priority:
 *
 * 1. Flash Sale khusus weight option
 * 2. Flash Sale umum produk
 */

const activeFlashSaleItem =
  useMemo(() => {
    const availableItems =
      flashSaleItems.filter(
        (item) =>
          item.stockLimit >
          item.soldQuantity
      );

    /**
     * Flash Sale khusus weight.
     */

    if (selectedWeightOption) {
      const weightSpecificItem =
        availableItems.find(
          (item) =>
            item.weightOptionId ===
            selectedWeightOption.id
        );

      if (weightSpecificItem) {
        return weightSpecificItem;
      }
    }

    /**
     * Fallback ke Flash Sale
     * yang berlaku untuk seluruh produk.
     */

    return (
      availableItems.find(
        (item) =>
          item.weightOptionId ===
          null
      ) ?? null
    );
  }, [
    flashSaleItems,
    selectedWeightOption,
  ]);

  /**
 * ==========================================================
 * BASE COMBINATION PRICE
 * ==========================================================
 *
 * Harga:
 *
 * Weight
 * +
 * Variant Adjustment
 */

/**
 * ==========================================================
 * BASE COMBINATION PRICE
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

/**
 * Harga normal berdasarkan:
 *
 * Weight Price
 * +
 * Variant Adjustment
 */

const originalUnitPrice =
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
 * DISCOUNT STATUS
 * ==========================================================
 */

const now =
  new Date();

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
  Number(discountValue) > 0 &&
  hasDiscountStarted &&
  !hasDiscountEnded;

/**
 * ==========================================================
 * DISCOUNT CALCULATION
 * ==========================================================
 */

const discountAmount =
  (() => {
    if (
      !isDiscountCurrentlyActive
    ) {
      return 0;
    }

    const value =
      Math.max(
        0,
        Number(discountValue)
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

      return (
        originalUnitPrice *
        (percentage / 100)
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
  })();

/**
 * ==========================================================
 * FINAL PRICE
 * ==========================================================
 *
 * Priority:
 *
 * 1. Flash Sale
 * 2. Product Discount
 * 3. Normal Price
 *
 * IMPORTANT:
 *
 * Harga Flash Sale adalah harga dasar untuk
 * weight / produk yang dipilih.
 *
 * Variant adjustment tetap harus ditambahkan.
 *
 * Contoh:
 *
 * Flash Sale      Rp10.000
 * Dibersihkan     +Rp5.000
 *
 * Final           Rp15.000
 */

const isFlashSaleApplied =
  activeFlashSaleItem !== null;


/**
 * ==========================================================
 * FLASH SALE BASE PRICE
 * ==========================================================
 */

const flashSaleBasePrice =
  isFlashSaleApplied
    ? Math.max(
        0,
        Number(
          activeFlashSaleItem.flashPrice
        )
      )
    : 0;


/**
 * ==========================================================
 * FINAL UNIT PRICE
 * ==========================================================
 */

const unitPrice =
  isFlashSaleApplied
    ? Math.max(
        0,
        flashSaleBasePrice +
          variantAdjustment
      )
    : Math.max(
        0,
        originalUnitPrice -
          discountAmount
      );


const totalPrice =
  unitPrice *
  quantity;

/**
 * ==========================================================
 * ORIGINAL PRICE
 * ==========================================================
 *
 * Harga normal tetap mengikuti kombinasi:
 *
 * Weight Price
 * +
 * Variant Adjustment
 *
 * Jangan gunakan Flash Sale originalPrice secara langsung,
 * karena variant adjustment harus tetap diperhitungkan.
 */

const currentOriginalPrice =
  originalUnitPrice;


const totalOriginalPrice =
  currentOriginalPrice *
  quantity;

/**
 * ==========================================================
 * SAVING
 * ==========================================================
 */

const currentSaving =
  Math.max(
    0,
    currentOriginalPrice -
      unitPrice
  );

const totalDiscountAmount =
  currentSaving *
  quantity;

/**
 * ==========================================================
 * FLASH SALE STOCK QUOTA
 * ==========================================================
 */

const flashSaleRemainingStock =
  isFlashSaleApplied &&
  activeFlashSaleItem
    ? Math.max(
        0,
        activeFlashSaleItem.stockLimit -
          activeFlashSaleItem.soldQuantity
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
  activeFlashSaleItem.stockLimit > 0
    ? Math.min(
        100,
        Math.max(
          0,
          (
            activeFlashSaleItem.soldQuantity /
            activeFlashSaleItem.stockLimit
          ) * 100
        )
      )
    : 0;

/**
 * ==========================================================
 * EFFECTIVE MAX QUANTITY
 * ==========================================================
 */

const effectiveMaxQuantity =
  flashSaleRemainingStock !== null
    ? Math.min(
        stock,
        flashSaleRemainingStock
      )
    : stock;

    /**
 * ==========================================================
 * FLASH SALE SOLD OUT
 * ==========================================================
 */

const isFlashSaleSoldOut =
  isFlashSaleApplied &&
  flashSaleRemainingStock !== null &&
  flashSaleRemainingStock <= 0;

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
  if (
    effectiveMaxQuantity <= 0
  ) {
    setSuccess(false);

    setMessage(
      "Kuota Flash Sale sudah habis."
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
  /**
   * ========================================================
   * UPDATE SELECTED WEIGHT
   * ========================================================
   */

  setSelectedWeight(
    weight
  );


  /**
   * ========================================================
   * FIND NEXT FLASH SALE ITEM
   * ========================================================
   *
   * Cari Flash Sale khusus weight yang baru dipilih.
   * Jika tidak ada, gunakan Flash Sale product-wide.
   */

  const nextWeightOption =
    weightOptions.find(
      (option) =>
        option.label === weight
    );

  const nextWeightOptionId =
    nextWeightOption?.id ??
    null;

  const nextFlashSaleItem =
    flashSaleItems.find(
      (item) =>
        item.weightOptionId ===
        nextWeightOptionId
    ) ??
    flashSaleItems.find(
      (item) =>
        item.weightOptionId ===
        null
    ) ??
    null;


  /**
   * ========================================================
   * CALCULATE NEXT MAX QUANTITY
   * ========================================================
   */

  const nextFlashSaleRemainingStock =
    nextFlashSaleItem
      ? Math.max(
          0,
          nextFlashSaleItem.stockLimit -
            nextFlashSaleItem.soldQuantity
        )
      : null;

  const nextEffectiveMaxQuantity =
    nextFlashSaleRemainingStock !==
    null
      ? Math.min(
          stock,
          nextFlashSaleRemainingStock
        )
      : stock;


  /**
   * ========================================================
   * CLAMP CURRENT QUANTITY
   * ========================================================
   *
   * Jika quantity saat ini lebih besar
   * dari kuota weight baru,
   * otomatis turunkan quantity.
   */

  setQuantity(
    (current) =>
      Math.max(
        1,
        Math.min(
          current,
          nextEffectiveMaxQuantity
        )
      )
  );


  /**
   * ========================================================
   * RESET MESSAGE
   * ========================================================
   */

  resetMessage();
}

/**
 * ==========================================================
 * VALIDATION
 * ==========================================================
 */

function validateSelection() {
  /**
   * ========================================================
   * FLASH SALE SOLD OUT
   * ========================================================
   */

  if (isFlashSaleSoldOut) {
    setSuccess(false);

    setMessage(
      "Maaf, kuota Flash Sale untuk pilihan ini sudah habis."
    );

    return false;
  }


  /**
   * ========================================================
   * PRODUCT OUT OF STOCK
   * ========================================================
   */

  if (outOfStock) {
    setSuccess(false);

    setMessage(
      "Produk sedang habis."
    );

    return false;
  }


  /**
   * ========================================================
   * MINIMUM QUANTITY
   * ========================================================
   */

  if (quantity < 1) {
    setSuccess(false);

    setMessage(
      "Jumlah produk minimal 1."
    );

    return false;
  }


  /**
   * ========================================================
   * EFFECTIVE MAX QUANTITY
   * ========================================================
   *
   * Jika Flash Sale aktif,
   * quantity tidak boleh melebihi:
   *
   * stock produk
   * ATAU
   * sisa kuota Flash Sale.
   */

  if (
    quantity >
    effectiveMaxQuantity
  ) {
    setSuccess(false);

    setMessage(
      isFlashSaleApplied
        ? `Kuota Flash Sale tersisa ${effectiveMaxQuantity} produk.`
        : `Jumlah maksimal ${effectiveMaxQuantity}.`
    );

    return false;
  }


  /**
   * ========================================================
   * PRODUCT STOCK VALIDATION
   * ========================================================
   */

  if (quantity > stock) {
    setSuccess(false);

    setMessage(
      `Jumlah maksimal ${stock}.`
    );

    return false;
  }


  /**
   * ========================================================
   * VARIANT VALIDATION
   * ========================================================
   */

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


  /**
   * ========================================================
   * WEIGHT VALIDATION
   * ========================================================
   */

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


  /**
   * ========================================================
   * VALID
   * ========================================================
   */

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
 * ==========================================================
 * NOTIFY CART UPDATE
 * ==========================================================
 *
 * Memberi tahu seluruh component yang membutuhkan
 * informasi cart terbaru.
 *
 * Saat ini digunakan oleh:
 *
 * - MobileBottomNavigation
 *
 * Tidak perlu pindah halaman atau refresh page.
 */

window.dispatchEvent(
  new Event(
    "cart-updated"
  )
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

<div>
  {isFlashSaleApplied &&
  activeFlashSaleItem ? (
    <div className="overflow-hidden border-y border-orange-100 bg-[#fff4f1]">

      {/* ================================================== */}
      {/* FLASH SALE HEADER */}
      {/* ================================================== */}

      <div
        className="
          flex
          flex-col
          gap-3
          bg-linear-to-r
          from-[#fc2600]
          to-[#f739a8]
          px-5
          py-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/* FLASH SALE LABEL */}

        <div
          className="
            flex
            items-center
            gap-2
          "
        >
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

          {currentSaving > 0 &&
          currentOriginalPrice > 0 && (
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
                ) * 100
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

      {/* ================================================== */}
      {/* FLASH SALE PRICE */}
      {/* ================================================== */}

      <div className="px-5 py-4">

        {/* CAMPAIGN NAME */}

        <p
          className="
            mb-3
            text-xs
            font-medium
            text-slate-500
          "
        >
          {activeFlashSaleItem.campaignName}
        </p>

        {/* ================================================== */}
{/* FLASH SALE STOCK PROGRESS */}
{/* ================================================== */}

{flashSaleRemainingStock !== null && (
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
    {/* HEADER */}

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
        Sisa {flashSaleRemainingStock}
      </span>
    </div>

    {/* PROGRESS BAR */}

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
          from-[#ff4d2d]
          to-[#ff8a4c]
          transition-all
          duration-500
        "
        style={{
          width:
            `${flashSaleSoldPercentage}%`,
        }}
      />
    </div>

    {/* SOLD INFORMATION */}

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

        <span
          className="
            font-bold
            text-slate-700
          "
        >
          {activeFlashSaleItem.soldQuantity}
        </span>

        {" dari "}

        <span
          className="
            font-bold
            text-slate-700
          "
        >
          {activeFlashSaleItem.stockLimit}
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
) : flashSaleSoldPercentage >= 80 ? (
  <span
    className="
      font-semibold
      text-[#ee4d2d]
    "
  >
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
          {/* FLASH PRICE */}

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

          {/* ORIGINAL PRICE */}

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

        {/* SAVING */}

        {currentSaving > 0 && (
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

        {/* QUANTITY TOTAL */}

        {quantity > 1 && (
          <div
            className="
              mt-4
              border-t
              border-orange-100
              pt-3
              text-xs
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-3
                text-slate-500
              "
            >
              <span>
                {quantity} ×{" "}
                {formatRupiah(
                  unitPrice
                )}
              </span>

              <span
                className="
                  font-semibold
                  text-slate-900
                "
              >
                {formatRupiah(
                  totalPrice
                )}
              </span>
            </div>

            {totalDiscountAmount > 0 && (
              <div
                className="
                  mt-1
                  text-right
                  font-medium
                  text-emerald-600
                "
              >
                Total hemat{" "}
                {formatRupiah(
                  totalDiscountAmount
                )}
              </div>
            )}
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

      {/* QUANTITY TOTAL */}

      {quantity > 1 && (
        <div
          className="
            mt-3
            border-t
            border-slate-200
            pt-3
            text-xs
            text-slate-500
          "
        >
          {isDiscountCurrentlyActive && (
            <div className="mb-1">
              Harga normal total:{" "}

              <span className="line-through">
                {formatRupiah(
                  totalOriginalPrice
                )}
              </span>
            </div>
          )}

          <div>
            {quantity} ×{" "}

            {formatRupiah(
              unitPrice
            )}

            <span className="mx-2">
              =
            </span>

            <span
              className="
                font-semibold
                text-slate-900
              "
            >
              {formatRupiah(
                totalPrice
              )}
            </span>
          </div>

          {isDiscountCurrentlyActive && (
            <div
              className="
                mt-1
                font-medium
                text-emerald-600
              "
            >
              Total hemat{" "}

              {formatRupiah(
                totalDiscountAmount
              )}
            </div>
          )}
        </div>
      )}
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
  "min-h-13.5 rounded-xl border px-4 py-2 text-sm transition",
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
  "min-w-19.5 rounded-xl border px-4 py-2 text-sm font-medium transition",
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

        outOfStock ||
        isFlashSaleSoldOut
          ? "border-slate-200 opacity-60"
          : "border-slate-300",
      ].join(" ")}
    >
      {/* ================================================ */}
      {/* DECREASE */}
      {/* ================================================ */}

      <button
        type="button"
        onClick={decrease}
        disabled={
          outOfStock ||
          isFlashSaleSoldOut ||
          isPending ||
          quantity <= 1
        }
        className="flex h-full w-10 items-center justify-center border-r border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Kurangi jumlah"
      >
        <Minus className="h-4 w-4" />
      </button>

      {/* ================================================ */}
      {/* QUANTITY VALUE */}
      {/* ================================================ */}

      <span className="flex h-full min-w-12 items-center justify-center text-sm font-medium text-slate-900">
        {quantity}
      </span>

      {/* ================================================ */}
      {/* INCREASE */}
      {/* ================================================ */}

      <button
        type="button"
        onClick={increase}
        disabled={
          outOfStock ||
          isFlashSaleSoldOut ||
          isPending ||
          effectiveMaxQuantity <= 0 ||
          quantity >= effectiveMaxQuantity
        }
        className="flex h-full w-10 items-center justify-center border-l border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Tambah jumlah"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>

    {/* ================================================== */}
    {/* STOCK / FLASH SALE QUOTA INFO */}
    {/* ================================================== */}

    {!outOfStock && (
      <span className="text-xs text-slate-400">
        {isFlashSaleApplied &&
        flashSaleRemainingStock !== null
          ? flashSaleRemainingStock <= 0
            ? "Kuota Flash Sale habis"
            : `${flashSaleRemainingStock} kuota Flash Sale tersisa`
          : `${stock} tersedia`}
      </span>
    )}
  </div>
</div>

{/* ============================================== */}
{/* PRICE SUMMARY */}
{/* ============================================== */}

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
  {isFlashSaleApplied ? (
    <div className="space-y-3">

      {/* FLASH SALE HEADER */}

      <div
        className="
          flex
          items-start
          justify-between
          gap-3
        "
      >
        <div>
          <p
            className="
              text-xs
              font-bold
              uppercase
              tracking-wide
              text-red-600
            "
          >
            🔥 Flash Sale
          </p>

          {activeFlashSaleItem?.campaignName && (
            <p
              className="
                mt-1
                text-xs
                text-slate-500
              "
            >
              {activeFlashSaleItem.campaignName}
            </p>
          )}
        </div>

        {currentSaving > 0 && (
          <span
            className="
              shrink-0
              rounded-full
              bg-red-100
              px-2.5
              py-1
              text-xs
              font-bold
              text-red-600
            "
          >
            Hemat{" "}
            {formatRupiah(
              currentSaving
            )}
          </span>
        )}
      </div>

      {/* PRICE */}

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
              text-slate-500
            "
          >
            Harga normal
          </span>

          <span
            className="
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

        <div
          className="
            mt-2
            flex
            items-center
            justify-between
            gap-4
          "
        >
          <span
            className="
              font-semibold
              text-slate-700
            "
          >
            Harga Flash Sale
          </span>

          <span
            className="
              text-xl
              font-bold
              text-red-600
            "
          >
            {formatRupiah(
              unitPrice
            )}
          </span>
        </div>
      </div>

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
              className="
                text-lg
                font-bold
                text-red-600
              "
            >
              {formatRupiah(
                totalPrice
              )}
            </span>
          </div>

          {totalDiscountAmount > 0 && (
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
  ) : (
    <div className="space-y-3">

      {/* ORIGINAL PRICE */}

      {currentSaving > 0 && (
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
              text-slate-500
            "
          >
            Harga normal
          </span>

          <span
            className="
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
          {currentSaving > 0
            ? "Harga setelah diskon"
            : "Harga"}
        </span>

        <span
          className="
            text-xl
            font-bold
            text-slate-900
          "
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
          <span
            className="
              text-sm
              text-slate-500
            "
          >
            Hemat
          </span>

          <span
            className="
              text-sm
              font-semibold
              text-emerald-600
            "
          >
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
              className="
                text-lg
                font-bold
                text-slate-900
              "
            >
              {formatRupiah(
                totalPrice
              )}
            </span>
          </div>

          {totalDiscountAmount > 0 && (
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
  )}
</div>

{/* ====================================================== */}
{/* ACTION BUTTONS */}
{/* ====================================================== */}

<div className="border-t border-slate-200 pt-6">
  <div className="grid gap-3 sm:grid-cols-2">
    {/* ================================================== */}
    {/* ADD TO CART */}
    {/* ================================================== */}

    <button
      type="button"
      onClick={() =>
        submitProduct(false)
      }
      disabled={
        outOfStock ||
        isFlashSaleSoldOut ||
        isPending ||
        effectiveMaxQuantity <= 0
      }
      className={[
        "flex min-h-12 items-center justify-center gap-2",
        "rounded-xl border px-5 py-3",
        "text-sm font-semibold transition",
        outOfStock ||
        isFlashSaleSoldOut ||
        isPending ||
        effectiveMaxQuantity <= 0
          ? [
              "cursor-not-allowed",
              "border-slate-200",
              "bg-slate-100",
              "text-slate-400",
            ].join(" ")
          : [
              "border-cyan-600",
              "bg-white",
              "text-cyan-700",
              "hover:bg-cyan-50",
              "active:scale-[0.99]",
            ].join(" "),
      ].join(" ")}
    >
      {isPending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

          Memproses...
        </>
      ) : isFlashSaleSoldOut ? (
        "Kuota Flash Sale Habis"
      ) : outOfStock ? (
        "Produk Habis"
      ) : (
        "Tambah ke Keranjang"
      )}
    </button>


    {/* ================================================== */}
    {/* BUY NOW */}
    {/* ================================================== */}

    <button
      type="button"
      onClick={() =>
        submitProduct(true)
      }
      disabled={
        outOfStock ||
        isFlashSaleSoldOut ||
        isPending ||
        effectiveMaxQuantity <= 0
      }
      className={[
        "flex min-h-12 items-center justify-center gap-2",
        "rounded-xl px-5 py-3",
        "text-sm font-semibold text-white transition",
        outOfStock ||
        isFlashSaleSoldOut ||
        isPending ||
        effectiveMaxQuantity <= 0
          ? [
              "cursor-not-allowed",
              "bg-slate-300",
              "text-slate-500",
            ].join(" ")
          : [
              isFlashSaleApplied
                ? "bg-red-600 hover:bg-red-700"
                : "bg-cyan-600 hover:bg-cyan-700",
              "shadow-sm",
              "active:scale-[0.99]",
            ].join(" "),
      ].join(" ")}
    >
      {isPending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

          Memproses...
        </>
      ) : isFlashSaleSoldOut ? (
        "Kuota Flash Sale Habis"
      ) : outOfStock ? (
        "Produk Habis"
      ) : (
        "Beli Sekarang"
      )}
    </button>
  </div>


  {/* ================================================== */}
  {/* ACTION HELPER */}
  {/* ================================================== */}

  {!outOfStock &&
    !isFlashSaleSoldOut &&
    effectiveMaxQuantity > 0 && (
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