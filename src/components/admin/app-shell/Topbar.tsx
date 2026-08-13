"use client";

import { Menu, Bell, Settings } from "lucide-react";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({
  onMenuClick,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4 md:px-6 lg:px-8">
      <div className="flex flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors hover:bg-muted lg:hidden"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden w-full max-w-md md:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="h-10 w-full rounded-lg border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-muted"
          aria-label="Notifikasi"
        >
          <Bell className="h-5 w-5" />
        </button>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-muted"
          aria-label="Pengaturan"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

export default Topbar;