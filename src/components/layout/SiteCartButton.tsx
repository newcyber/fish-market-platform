"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

type CartCountResponse = {
  success?: boolean;
  count?: number;
};

interface SiteCartButtonProps {
  mode?: "public" | "customer";
}

export default function SiteCartButton({
  mode = "public",
}: SiteCartButtonProps) {
  const [cartCount, setCartCount] = useState(0);

  const loadCartCount = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/cart/count",
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

      const result: CartCountResponse =
        await response.json();

      if (!result.success) {
        return;
      }

      const count = Number(
        result.count ?? 0
      );

      setCartCount(
        Number.isFinite(count)
          ? Math.max(0, count)
          : 0
      );
    } catch (error) {
      console.error(
        "[SITE_CART_COUNT_ERROR]",
        error
      );
    }
  }, []);

  useEffect(() => {
    const initialLoadTimer =
      window.setTimeout(() => {
        void loadCartCount();
      }, 0);

    function handleCartUpdated() {
      void loadCartCount();
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
  }, [loadCartCount]);

  const cartHref =
    mode === "customer"
      ? "/customer/cart"
      : "/cart";

  return (
    <Link
      href={cartHref}
      aria-label={
        cartCount > 0
          ? `Keranjang, ${cartCount} item`
          : "Keranjang"
      }
      className="
        relative
        inline-flex
        h-10
        w-10
        shrink-0
        items-center
        justify-center
        rounded-xl
        border
        border-slate-200
        bg-white
        text-slate-700
        transition
        hover:border-[var(--pisjo-soft-blue)]
        hover:bg-[var(--pisjo-soft-blue)]
        hover:text-[var(--pisjo-ocean)]
      "
    >
      <ShoppingCart className="h-5 w-5" />

      {cartCount > 0 && (
        <span
          className="
            absolute
            -right-1.5
            -top-1.5
            flex
            min-h-5
            min-w-5
            items-center
            justify-center
            rounded-full
            bg-[var(--pisjo-primary)]
            px-1
            text-[10px]
            font-bold
            leading-none
            text-white
            ring-2
            ring-white
          "
        >
          {cartCount > 99
            ? "99+"
            : cartCount}
        </span>
      )}
    </Link>
  );
}
