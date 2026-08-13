"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";

import { logout } from "@/actions/auth/logout";

import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({
  className,
}: LogoutButtonProps) {
  const [isPending, startTransition] =
    useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logout();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      disabled={isPending}
      onClick={handleLogout}
    >
      <LogOut className="mr-2 h-4 w-4" />

      {isPending
        ? "Keluar..."
        : "Logout"}
    </Button>
  );
}

export default LogoutButton;