"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import { ArrowLeft } from "lucide-react";

import MobileLoginLanding from "@/components/auth/MobileLoginLanding";

interface MobileLoginContentProps {
  children: React.ReactNode;
  storeName: string;
  storeDescription: string;
  siteLogo: string | null;
  storeInitial: string;
}

export default function MobileLoginContent({
  children,
  storeName,
  storeDescription,
  siteLogo,
  storeInitial,
}: MobileLoginContentProps) {
  const pathname = usePathname();

  const [showLogin, setShowLogin] =
    useState(false);

  /**
   * ============================================================
   * NON-LOGIN AUTH PAGES
   * ============================================================
   *
   * Register, forgot password, reset password,
   * verify email, dan halaman auth lainnya tetap
   * menggunakan children dari AuthLayout.
   */
  if (pathname !== "/login") {
    return <>{children}</>;
  }

  /**
   * ============================================================
   * MOBILE LOGIN LANDING
   * ============================================================
   *
   * State awal /login menampilkan landing mobile.
   */
  if (!showLogin) {
    return (
      <MobileLoginLanding
        storeName={storeName}
        storeDescription={storeDescription}
        siteLogo={siteLogo}
        storeInitial={storeInitial}
        onLogin={() => {
          setShowLogin(true);
        }}
      />
    );
  }

  /**
   * ============================================================
   * MOBILE LOGIN FORM
   * ============================================================
   *
   * Setelah user memilih "Masuk", tampilkan LoginForm
   * dari children AuthLayout.
   */
  return (
    <div
      className="
        w-full
        px-4
        pb-6
        pt-3
        sm:px-6
        sm:pb-8
        sm:pt-4
      "
    >
      <div className="mx-auto w-full max-w-md">
        <button
          type="button"
          onClick={() => {
            setShowLogin(false);
          }}
          className="
            mb-3
            inline-flex
            min-h-11
            items-center
            gap-2
            rounded-lg
            px-2
            text-sm
            font-semibold
            text-[var(--pisjo-ocean)]
            transition-colors
            duration-200
            hover:bg-[var(--pisjo-soft-blue)]
            hover:text-[var(--pisjo-primary)]
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-[var(--pisjo-primary)]
            focus-visible:ring-offset-2
            active:scale-[0.98]
            sm:mb-4
          "
          aria-label="Kembali ke halaman login"
        >
          <ArrowLeft
            aria-hidden="true"
            className="h-4 w-4 shrink-0"
          />

          <span>Kembali</span>
        </button>

        {children}
      </div>
    </div>
  );
}
