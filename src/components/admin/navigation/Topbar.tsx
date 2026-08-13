import { Search, Bell, Settings } from "lucide-react";

import { Input } from "@/components/ui/input";

import Link from "next/link";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex h-16 items-center justify-between gap-4 px-6">
        {/* Left Section */}
        <div className="flex flex-1 items-center gap-4">
          <div className="relative hidden w-full max-w-md lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              placeholder="Search..."
              className="pl-10"
              disabled
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-accent"
          >
            <Bell className="h-5 w-5" />
          </button>

          <Link
  href="/admin/settings"
  aria-label="Pengaturan"
  className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-accent"
>
  <Settings className="h-5 w-5" />
</Link>

          <div className="ml-2 h-10 w-px bg-border" />

          <div className="rounded-lg border px-3 py-2">
            <p className="text-sm font-medium">
              Administrator
            </p>

            <p className="text-xs text-muted-foreground">
              Enterprise Panel
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;