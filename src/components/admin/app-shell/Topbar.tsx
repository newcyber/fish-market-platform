"use client";

import {
  Menu,
  Settings,
  User,
} from "lucide-react";

import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";

import NotificationBell from "@/components/admin/notification/NotificationBell";
import { LogoutButton } from "@/components/admin/user/LogoutButton";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  onMenuClick: () => void;

  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

function formatRole(role: Role) {
  return String(role)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word.charAt(0)
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "U";
}

export function Topbar({
  onMenuClick,
  user,
}: TopbarProps) {
  const router = useRouter();

  function handleProfileClick() {
    router.push("/admin/profile");
  }

  function handleSettingsClick() {
    router.push("/admin/settings");
  }

  const initials = getInitials(
    user.name
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4 md:px-6 lg:px-8">
      {/* ======================================================
          LEFT SECTION
      ====================================================== */}

      <div className="flex flex-1 items-center gap-3">
        {/* MOBILE MENU */}

        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors hover:bg-muted lg:hidden"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* SEARCH */}

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

      {/* ======================================================
          RIGHT SECTION
      ====================================================== */}

      <div className="flex items-center gap-2">
        {/* NOTIFICATION */}

        <NotificationBell />

        {/* SETTINGS */}

        <button
          type="button"
          onClick={handleSettingsClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-muted"
          aria-label="Pengaturan"
          title="Pengaturan"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* ==================================================
            USER PROFILE MENU
        ================================================== */}

        <DropdownMenu>
          <DropdownMenuTrigger
            className="
              flex
              items-center
              gap-2
              rounded-xl
              px-2
              py-1.5
              outline-none
              transition-colors
              hover:bg-muted
              focus-visible:ring-2
              focus-visible:ring-primary/30
            "
            aria-label="Menu profil"
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback>
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="hidden max-w-44 text-left sm:block">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.name || "User"}
              </p>

              <p className="truncate text-xs text-muted-foreground">
                {formatRole(user.role)}
              </p>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-72"
          >
            {/* ==================================================
                USER INFORMATION
                Jangan gunakan DropdownMenuLabel.
                Implementasi Base UI project ini membutuhkan
                Group context untuk component tersebut.
            ================================================== */}

            <div className="px-2 py-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {user.name || "User"}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>

                  <p className="mt-1 text-xs font-medium text-primary">
                    {formatRole(user.role)}
                  </p>
                </div>
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* PROFILE */}

            <DropdownMenuItem
              onClick={handleProfileClick}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />

              <span>
                Profil Saya
              </span>
            </DropdownMenuItem>

            {/* SETTINGS */}

            <DropdownMenuItem
              onClick={handleSettingsClick}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />

              <span>
                Pengaturan
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* LOGOUT */}

            <div className="px-1">
              <LogoutButton
                className="w-full justify-start"
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default Topbar;