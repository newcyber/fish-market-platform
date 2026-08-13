"use client";

import { useRouter } from "next/navigation";
import { Settings, User } from "lucide-react";

import { auth } from "@/auth";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { LogoutButton } from "./LogoutButton";

function formatRole(role: string) {
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function UserMenu() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  const initials = (user.name ?? "U")
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="
          flex
          items-center
          gap-3
          rounded-xl
          border
          bg-background
          px-3
          py-2
          transition-colors
          hover:bg-accent
        "
      >
        <Avatar className="h-9 w-9">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="hidden min-w-0 text-left lg:block">
          <p className="truncate text-sm font-semibold">
            {user.name}
          </p>

          <p className="truncate text-xs text-muted-foreground">
            {user.email}
          </p>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-72"
      >
        <DropdownMenuLabel>
          <div className="space-y-2">
            <p className="font-semibold">
              {user.name}
            </p>

            <p className="text-xs text-muted-foreground">
              {user.email}
            </p>

            <Badge variant="secondary">
              {formatRole(String(user.role))}
            </Badge>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <ProfileMenuItem />

        <SettingsMenuItem />

        <DropdownMenuSeparator />

        <div className="px-1">
          <LogoutButton className="w-full justify-start" />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProfileMenuItem() {
  const router = useRouter();

  return (
    <DropdownMenuItem
      onClick={() => router.push("/admin/profile")}
    >
      <User className="mr-2 h-4 w-4" />
      Profile
    </DropdownMenuItem>
  );
}

function SettingsMenuItem() {
  const router = useRouter();

  return (
    <DropdownMenuItem
      onClick={() => router.push("/admin/settings")}
    >
      <Settings className="mr-2 h-4 w-4" />
      Settings
    </DropdownMenuItem>
  );
}

export default UserMenu;