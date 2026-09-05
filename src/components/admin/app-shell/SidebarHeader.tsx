"use client";

import Image from "next/image";
import Link from "next/link";
import { Fish, X } from "lucide-react";

import { APP_CONFIG } from "@/config/app";

interface SidebarHeaderProps {
  storeName: string;
  siteLogo: string | null;
  siteDescription: string | null;
  onClose?: () => void;
}

export function SidebarHeader({
  storeName,
  siteLogo,
  siteDescription,
  onClose,
}: SidebarHeaderProps) {
  return (
    <div className="flex h-20 shrink-0 items-center border-b px-4 sm:px-6">
      <Link
        href="/"
        className="flex min-w-0 flex-1 items-center gap-3"
        onClick={onClose}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-primary-foreground">
          {siteLogo ? (
            <Image
              src={siteLogo}
              alt={`${storeName} logo`}
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
          ) : (
            <Fish className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {storeName}
          </p>

          <p className="truncate text-xs text-slate-500">
            {siteDescription?.trim() || APP_CONFIG.branding.adminTitle}
          </p>
        </div>
      </Link>

      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup menu"
        className="ml-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 touch-manipulation lg:hidden"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
