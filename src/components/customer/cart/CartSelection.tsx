"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import CartItemRow from "@/components/customer/cart/CartItemRow";

/**
 * ============================================================
 * CART ITEM TYPE
 * ============================================================
 */

type CartSelectionItem =
  Parameters<typeof CartItemRow>[0]["item"];

/**
 * ============================================================
 * PROPS
 * ============================================================
 */

interface CartSelectionProps {
  items: CartSelectionItem[];
}

/**
 * ============================================================
 * FORMAT RUPIAH
 * ============================================================
 */

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * ============================================================
 * CART SELECTION
 * ============================================================
 *
 * SOURCE OF TRUTH:
 *
 * /cart
 *     = semua item terpilih
 *
 * /cart?selected=id1,id2
 *     = hanya id1 dan id2 terpilih
 *
 * /cart?selected=
 *     = tidak ada item terpilih
 *
 * Selection disimpan di URL supaya:
 *
 * - refresh tetap konsisten
 * - checkout tahu item mana yang dipilih
 * - tidak bergantung pada local state yang mudah hilang
 * ============================================================
 */

export default function CartSelection({
  items,
}: CartSelectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * ==========================================================
   * SELECTED IDS
   * ==========================================================
   */

  const selectedIds = useMemo(() => {
    const hasSelectedParam =
      searchParams.has("selected");

    /**
     * Tidak ada parameter selected:
     * seluruh item dianggap dipilih.
     */
    if (!hasSelectedParam) {
      return new Set(
        items.map((item) => item.id)
      );
    }

    /**
     * selected kosong:
     * tidak ada item dipilih.
     */
    const rawValue =
      searchParams.get("selected") ?? "";

    return new Set(
      rawValue
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    );
  }, [items, searchParams]);

  /**
   * ==========================================================
   * SELECTED ITEMS
   * ==========================================================
   */

  const selectedItems = useMemo(() => {
    return items.filter((item) =>
      selectedIds.has(item.id)
    );
  }, [items, selectedIds]);

  /**
   * ==========================================================
   * SELECTION SUMMARY
   * ==========================================================
   */

  const allSelected =
    items.length > 0 &&
    selectedItems.length === items.length;

  const selectedQuantity =
    selectedItems.reduce(
      (total, item) =>
        total + Number(item.quantity),
      0
    );

  const selectedSubtotal =
    selectedItems.reduce(
      (total, item) =>
        total +
        Number(item.price) *
          Number(item.quantity),
      0
    );

  /**
   * ==========================================================
   * BUILD CART SELECTION URL
   * ==========================================================
   */

  function buildSelectionUrl(
    ids: string[]
  ) {
    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    /**
     * Semua item dipilih:
     *
     * /cart
     */
    if (
      ids.length === items.length
    ) {
      params.delete("selected");
    } else {
      /**
       * Sebagian / tidak ada item:
       *
       * /cart?selected=id1,id2
       *
       * atau
       *
       * /cart?selected=
       */
      params.set(
        "selected",
        ids.join(",")
      );
    }

    const query =
      params.toString();

    return query
      ? `${pathname}?${query}`
      : pathname;
  }

  /**
   * ==========================================================
   * TOGGLE SINGLE ITEM
   * ==========================================================
   */

  function toggleItem(
    cartItemId: string
  ) {
    const next =
      new Set(selectedIds);

    if (
      next.has(cartItemId)
    ) {
      next.delete(cartItemId);
    } else {
      next.add(cartItemId);
    }

    /**
     * Selalu mengikuti urutan item
     * yang ada di cart.
     */
    const nextIds =
      items
        .filter((item) =>
          next.has(item.id)
        )
        .map((item) => item.id);

    router.replace(
      buildSelectionUrl(nextIds),
      {
        scroll: false,
      }
    );
  }

  /**
   * ==========================================================
   * TOGGLE ALL
   * ==========================================================
   */

  function toggleAll() {
    /**
     * Jika semua dipilih,
     * kosongkan selection.
     */
    if (allSelected) {
      router.replace(
        buildSelectionUrl([]),
        {
          scroll: false,
        }
      );

      return;
    }

    /**
     * Jika belum semua dipilih,
     * pilih semua.
     */
    const allIds =
      items.map((item) => item.id);

    router.replace(
      buildSelectionUrl(allIds),
      {
        scroll: false,
      }
    );
  }

  /**
   * ==========================================================
   * CHECKOUT URL
   * ==========================================================
   */

  const checkoutUrl = useMemo(() => {
    /**
     * Tidak perlu selected jika
     * seluruh cart dipilih.
     */
    if (allSelected) {
      return "/customer/checkout";
    }

    const ids =
      selectedItems.map(
        (item) => item.id
      );

    const params =
      new URLSearchParams();

    params.set(
      "selected",
      ids.join(",")
    );

    return `/customer/checkout?${params.toString()}`;
  }, [allSelected, selectedItems]);

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
      "
    >
      {/* ================================================== */}
      {/* SELECT ALL HEADER                                  */}
      {/* ================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-slate-100
          px-4
          py-3
          sm:px-5
        "
      >
        <button
          type="button"
          onClick={toggleAll}
          disabled={items.length === 0}
          aria-label={
            allSelected
              ? "Batalkan semua pilihan"
              : "Pilih semua produk"
          }
          aria-pressed={allSelected}
          className="
            flex
            items-center
            gap-2
            text-sm
            font-medium
            text-slate-800
            transition
            hover:text-emerald-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <span
            className={[
              "flex h-5 w-5 items-center justify-center",
              "rounded-md border-2 transition",
              allSelected
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-300 bg-white",
            ].join(" ")}
          >
            {allSelected && (
              <Check
                className="h-3.5 w-3.5"
                strokeWidth={3}
              />
            )}
          </span>

          <span>
            Pilih Semua
          </span>
        </button>

        <span
          className="
            text-xs
            text-slate-400
          "
        >
          {items.length} produk
        </span>
      </div>

      {/* ================================================== */}
      {/* PRODUCT LIST                                       */}
      {/* ================================================== */}

      <div>
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            selected={selectedIds.has(
              item.id
            )}
            onToggle={toggleItem}
          />
        ))}
      </div>

      {/* ================================================== */}
      {/* MOBILE / DESKTOP CHECKOUT BAR                      */}
      {/* ================================================== */}

<div
  className="
    fixed
    inset-x-0
    bottom-0
    z-50
    border-t
    border-slate-200
    bg-white/95
    px-4
    py-3
    shadow-[0_-4px_16px_rgba(0,0,0,0.06)]
    backdrop-blur
    sm:px-5
  "
>
  <div className="mx-auto max-w-6xl">
    <div
      className="
        flex
        items-center
        justify-between
        gap-3
      "
    >
          <div className="min-w-0">
            <p
              className="
                text-[11px]
                text-slate-500
              "
            >
              Total
            </p>

            <p
              className="
                truncate
                text-lg
                font-bold
                text-slate-950
              "
            >
              {formatRupiah(
                selectedSubtotal
              )}
            </p>
          </div>

          {selectedItems.length > 0 ? (
            <Link
              href={checkoutUrl}
              className="
                flex
                min-h-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-emerald-600
                px-5
                text-sm
                font-bold
                text-white
                shadow-sm
                transition
                hover:bg-emerald-700
                active:scale-[0.98]
              "
            >
              Checkout ({selectedQuantity})
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="
                flex
                min-h-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-slate-200
                px-5
                text-sm
                font-bold
                text-slate-400
                disabled:cursor-not-allowed
              "
            >
              Checkout
            </button>
          )}
    </div>
  </div>
</div>
    </section>
  );
}
