"use client";

import Image from "next/image";

import {
  useAuthBranding,
} from "@/components/auth/AuthBrandingProvider";

/**
 * ============================================================
 * AUTH HEADER PROPS
 * ============================================================
 */

interface AuthHeaderProps {
  title: string;
  description: string;
}

/**
 * ============================================================
 * AUTH HEADER
 * ============================================================
 */

export function AuthHeader({
  title,
  description,
}: AuthHeaderProps) {
  const {
    storeName,
    siteLogo,
    storeInitial,
  } = useAuthBranding();

  return (
    <div className="mb-8 flex flex-col items-center text-center">

      {/* ====================================================== */}
      {/* STORE LOGO */}
      {/* ====================================================== */}

      <div className="relative mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">

        {siteLogo ? (
          <Image
            src={siteLogo}
            alt={`${storeName} Logo`}
            fill
            sizes="64px"
            className="object-contain p-1.5"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-sky-700 text-lg font-bold text-white">
            {storeInitial}
          </div>
        )}

      </div>

      {/* ====================================================== */}
      {/* PAGE TITLE */}
      {/* ====================================================== */}

      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h1>

      {/* ====================================================== */}
      {/* DESCRIPTION */}
      {/* ====================================================== */}

      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>

    </div>
  );
}