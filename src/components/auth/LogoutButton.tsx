"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

import { signOut } from "next-auth/react";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({
  className = "",
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] =
    useState(false);

  const handleLogout = async () => {
    if (isLoading) {
      return;
    }

    try {
      setIsLoading(true);

      await signOut({
        callbackUrl: "/login",
      });
    } catch (error) {
      console.error(
        "[LOGOUT_ERROR]",
        error
      );

      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className={
        className ||
        "flex items-center gap-2 text-sm text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      }
    >
      <LogOut className="h-4 w-4" />

      {isLoading
        ? "Keluar..."
        : "Logout"}
    </button>
  );
}