"use client";

import Link from "next/link";
import { Fish } from "lucide-react";

import { APP_CONFIG } from "@/config/app";

interface SidebarHeaderProps {
  storeName: string;
}

export function SidebarHeader({
  storeName,
}: SidebarHeaderProps) {
  return (
    <div className="flex h-20 items-center border-b px-6">
      <Link
        href="/admin"
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Fish className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-bold">
            {storeName}
          </div>

          <div className="truncate text-xs text-muted-foreground">
            {APP_CONFIG.branding.adminTitle}
          </div>
        </div>
      </Link>
    </div>
  );
}