"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { LogoutButton } from "@/components/admin/user/LogoutButton";

interface SidebarFooterProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

export function SidebarFooter({
  user,
}: SidebarFooterProps) {
  if (!user) {
    return null;
  }

  const {
    name,
    email,
    role,
  } = user;

  const initials = (name ?? "U")
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formattedRole = role
    ? role.replace(/_/g, " ")
    : "USER";

  return (
    <footer className="mt-auto border-t bg-background">
      <div className="space-y-5 p-4">

        <div className="flex items-center gap-3">

          <Avatar className="h-11 w-11">
            <AvatarFallback className="font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">

            <h3 className="truncate text-sm font-semibold">
              {name ?? "User"}
            </h3>

            <p className="truncate text-xs text-muted-foreground">
              {email ?? "-"}
            </p>

          </div>

        </div>

        <div className="flex items-center justify-between">

          <Badge variant="secondary">
            {formattedRole}
          </Badge>

          <span className="text-xs text-emerald-600">
            Online
          </span>

        </div>

        <LogoutButton />

      </div>
    </footer>
  );
}

export default SidebarFooter;