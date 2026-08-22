"use client";

import type {
  ReactNode,
} from "react";

import {
  usePathname,
  useSearchParams,
} from "next/navigation";

interface ProductGridTransitionProps {
  children: ReactNode;
}

/**
 * ============================================================
 * PRODUCT GRID TRANSITION
 * ============================================================
 *
 * Memberikan smooth entrance ketika URL produk berubah,
 * misalnya:
 *
 * /customer/products
 * /customer/products?category=...
 * /customer/products?search=...
 *
 * Data dan filtering tetap ditangani oleh Server Component.
 */

export default function ProductGridTransition({
  children,
}: ProductGridTransitionProps) {
  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const transitionKey =
    `${pathname}?${searchParams.toString()}`;

  return (
    <div
      key={transitionKey}
      className="
        product-grid-transition
        motion-safe:animate-[product-grid-enter_420ms_cubic-bezier(0.22,1,0.36,1)_both]
      "
    >
      {children}
    </div>
  );
}