"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

interface CartSummaryResponse {
  success?: boolean;
  itemCount?: number;
  total?: number;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function StickyMobileCartBar() {
  const [itemCount, setItemCount] = useState(0);
  const [total, setTotal] = useState(0);

  const loadCartSummary = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/cart/summary",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return;
      }

      const result: CartSummaryResponse =
        await response.json();

      if (!result.success) {
        return;
      }

      const nextItemCount = Number(
        result.itemCount ?? 0
      );

      const nextTotal = Number(
        result.total ?? 0
      );

      setItemCount(
        Number.isFinite(nextItemCount)
          ? Math.max(0, nextItemCount)
          : 0
      );

      setTotal(
        Number.isFinite(nextTotal)
          ? Math.max(0, nextTotal)
          : 0
      );
    } catch (error) {
      console.error(
        "[STICKY_CART_SUMMARY_ERROR]",
        error
      );
    }
  }, []);

  useEffect(() => {
    const initialLoadTimer =
      window.setTimeout(() => {
        void loadCartSummary();
      }, 0);

    function handleCartUpdated() {
      void loadCartSummary();
    }

    window.addEventListener(
      "cart-updated",
      handleCartUpdated
    );

    return () => {
      window.clearTimeout(
        initialLoadTimer
      );

      window.removeEventListener(
        "cart-updated",
        handleCartUpdated
      );
    };
  }, [loadCartSummary]);

  /**
   * Jangan tampilkan sticky bar ketika cart kosong.
   */
  if (itemCount <= 0) {
    return null;
  }

  return (
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
        shadow-[0_-4px_20px_rgba(15,23,42,0.10)]
        backdrop-blur
        lg:hidden
      "
    >
      <div
        className="
          mx-auto
          flex
          max-w-xl
          items-center
          gap-3
        "
      >
        <div className="min-w-0 flex-1">
          <div
            className="
              flex
              items-center
              gap-2
              text-xs
              text-slate-500
            "
          >
            <ShoppingCart
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
            />

            <span>
              {itemCount} item
              {itemCount !== 1 ? "s" : ""}
            </span>
          </div>

          <div
            className="
              mt-0.5
              truncate
              text-base
              font-bold
              text-slate-900
            "
          >
            {formatRupiah(total)}
          </div>
        </div>

        <Link
          href="/cart"
          className="
            inline-flex
            min-h-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-[var(--pisjo-primary)]
            px-5
            text-sm
            font-semibold
            text-white
            shadow-sm
            transition
            hover:opacity-95
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-[var(--pisjo-primary)]
            focus-visible:ring-offset-2
          "
        >
          Lihat Keranjang
        </Link>
      </div>
    </div>
  );
}
