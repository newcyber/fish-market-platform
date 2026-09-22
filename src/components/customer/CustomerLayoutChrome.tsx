
"use client";

import { usePathname } from "next/navigation";

interface CustomerLayoutChromeProps {
  children: React.ReactNode;
  footer: React.ReactNode;
  bottomNavigation: React.ReactNode;
}

export default function CustomerLayoutChrome({
  children,
  footer,
  bottomNavigation,
}: CustomerLayoutChromeProps) {
  const pathname = usePathname();

  const isCheckoutPage =
    pathname === "/customer/checkout" ||
    pathname.startsWith("/customer/checkout/");

  return (
    <>
      {/* ========================================================
       * MAIN CONTENT
       * ======================================================== */}

      <main className={isCheckoutPage ? "flex-1" : "flex-1 pb-16 md:pb-0"}>
        {children}
      </main>

      {/* ========================================================
       * FOOTER + MOBILE BOTTOM NAVIGATION
       *
       * Tidak ditampilkan pada halaman checkout agar tidak
       * menambahkan ruang kosong dan scroll tambahan.
       * ======================================================== */}

      <div className={isCheckoutPage ? "hidden" : undefined}>
        {footer}
        {bottomNavigation}
      </div>
    </>
  );
}
