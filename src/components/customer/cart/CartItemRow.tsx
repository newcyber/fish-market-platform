import {
  ShoppingBag,
} from "lucide-react";

import CartService from "@/services/cart/cart.service";

import CartQuantityControl from "@/components/customer/cart/CartQuantityControl";

import CartVariantSheet from "@/components/customer/cart/CartVariantSheet";

import DeleteCartItemButton from "@/components/customer/cart/DeleteCartItemButton";

/**
 * ============================================================
 * CART ITEM TYPE
 * ============================================================
 *
 * Type diambil langsung dari CartService.getCart().
 *
 * Dengan cara ini:
 *
 * - tidak menggunakan any
 * - tidak menduplikasi struktur Prisma
 * - jika struktur CartService berubah,
 *   TypeScript akan ikut mendeteksi perubahan
 * ============================================================
 */

type CartData =
  NonNullable<
    Awaited<
      ReturnType<
        typeof CartService.getCart
      >
    >
  >;

type CartItem =
  CartData["items"][number];

/**
 * ============================================================
 * FORMAT RUPIAH
 * ============================================================
 */

function formatRupiah(value: unknown) {
  const amount =
    Number(value);

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(
    Number.isFinite(amount)
      ? amount
      : 0
  );
}

/**
 * ============================================================
 * PROPS
 * ============================================================
 */

interface CartItemRowProps {
  item: CartItem;
  selected: boolean;
  onToggle: (cartItemId: string) => void;
}

/**
 * ============================================================
 * CART ITEM ROW
 * ============================================================
 */

export default function CartItemRow({
  item,
  selected,
  onToggle,
}: CartItemRowProps) {
  /**
   * ==========================================================
   * PRODUCT IMAGE
   * ==========================================================
   */

  const image =
    item.product.images?.[0]?.image;

  /**
   * ==========================================================
   * ITEM SUBTOTAL
   * ==========================================================
   */

  const itemSubtotal =
    Number(item.price) *
    item.quantity;

  /**
   * ==========================================================
   * STOCK
   * ==========================================================
   *
   * SKU adalah sumber stock jika tersedia.
   *
   * Product.stock hanya fallback
   * untuk legacy product tanpa SKU.
   */

  const stock =
    item.sku?.stock ??
    item.product.stock;

  /**
   * ==========================================================
   * CUSTOMER NOTE
   * ==========================================================
   */

  const customerNote =
    typeof item.customerNote ===
    "string"
      ? item.customerNote.trim()
      : "";

/**
 * ==========================================================
 * VARIANT / SKU LABEL
 * ==========================================================
 *
 * SKU adalah source of truth.
 *
 * Legacy:
 *   productVariant
 *   productWeight
 *
 * tidak lagi digunakan untuk menampilkan pilihan
 * produk di cart.
 */

const variantLabel =
  item.sku?.skuOptions
    ?.map(
      (skuOption) =>
        skuOption.variantOption.label
    )
    .filter(Boolean)
    .join(" • ") ?? "";

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <article
      className="
        border-b
        border-slate-100
        bg-white
        px-4
        py-4
        last:border-b-0
        sm:px-5
      "
    >
      <div className="flex gap-3">

{/* ================================================== */}
{/* CHECKBOX SELECTION                                 */}
{/* ================================================== */}

<div className="flex shrink-0 items-start pt-1">
  <button
    type="button"
    onClick={() => onToggle(item.id)}
    aria-label={
      selected
        ? `Batalkan pilihan ${item.product.name}`
        : `Pilih ${item.product.name}`
    }
    aria-pressed={selected}
    className={[
      "flex h-5 w-5 items-center justify-center rounded-md border-2 transition",
      "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1",
      selected
        ? "border-emerald-600 bg-emerald-600 text-white"
        : "border-slate-300 bg-white",
    ].join(" ")}
  >
    {selected && (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="h-3.5 w-3.5"
      >
        <path
          d="m5 10 3 3 7-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}
  </button>
</div>

        {/* ================================================== */}
        {/* IMAGE                                               */}
        {/* ================================================== */}

        <div
          className="
            h-[76px]
            w-[76px]
            shrink-0
            overflow-hidden
            rounded-xl
            bg-slate-100
          "
        >
          {image ? (
            <img
              src={image}
              alt={item.product.name}
              className="
                h-full
                w-full
                object-cover
              "
            />
          ) : (
            <div
              className="
                flex
                h-full
                w-full
                items-center
                justify-center
              "
            >
              <ShoppingBag
                className="
                  h-7
                  w-7
                  text-slate-300
                "
              />
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* CONTENT                                             */}
        {/* ================================================== */}

        <div className="min-w-0 flex-1">

          {/* ================================================ */}
          {/* PRODUCT NAME + DELETE                            */}
          {/* ================================================ */}

          <div
            className="
              flex
              items-start
              justify-between
              gap-2
            "
          >

            <div className="min-w-0">

              <h3
                className="
                  line-clamp-2
                  text-sm
                  font-semibold
                  leading-5
                  text-slate-950
                "
              >
                {item.product.name}
              </h3>

{item.sku ? (
  <CartVariantSheet
    cartItemId={item.id}
    productName={item.product.name}
    currentSkuId={item.sku.id}
    currentLabel={variantLabel}
    onChanged={() => {
      window.location.reload();
    }}
  />
) : (
  variantLabel && (
    <p
      className="
        mt-0.5
        truncate
        text-[11px]
        text-slate-500
      "
    >
      {variantLabel}
    </p>
  )
)}

            </div>

            <DeleteCartItemButton
              cartItemId={item.id}
            />

          </div>

          {/* ================================================ */}
          {/* STOCK                                             */}
          {/* ================================================ */}

{stock <= 5 && (
  <p
    className="
      mt-1
      text-[11px]
      text-red-500
    "
  >
    Sisa {stock}
  </p>
)}

          {/* ================================================ */}
          {/* CUSTOMER NOTE                                    */}
          {/* ================================================ */}

          {customerNote && (
            <p
              className="
                mt-1
                line-clamp-1
                text-[11px]
                text-slate-400
              "
            >
              Catatan: {customerNote}
            </p>
          )}

{/* ================================================ */}
{/* PRICE + QUANTITY                                  */}
{/* ================================================ */}

<div
  className="
    mt-2
    flex
    items-end
    justify-between
    gap-3
  "
>
  {/* PRICE */}

  <div className="min-w-0">
    <p
      className="
        text-sm
        font-bold
        text-slate-950
      "
    >
      {formatRupiah(item.price)}
    </p>

    {item.quantity > 1 && (
      <p
        className="
          mt-0.5
          text-[10px]
          text-slate-400
        "
      >
        {item.quantity} × {formatRupiah(item.price)}
      </p>
    )}
  </div>

  {/* QUANTITY */}

  <CartQuantityControl
    cartItemId={item.id}
    initialQuantity={item.quantity}
    maxQuantity={stock}
  />
</div>

        </div>

      </div>
    </article>
  );
}
