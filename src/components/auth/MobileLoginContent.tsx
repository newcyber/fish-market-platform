"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import MobileLoginLanding from
  "@/components/auth/MobileLoginLanding";

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

  if (pathname !== "/login") {
    return <>{children}</>;
  }

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

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => {
          setShowLogin(false);
        }}
        className="
          mb-4
          text-sm
          font-medium
          text-sky-700
          hover:underline
        "
      >
        ← Kembali
      </button>

      {children}
    </div>
  );
}