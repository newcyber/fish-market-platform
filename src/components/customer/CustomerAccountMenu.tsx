"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { signOut } from "next-auth/react";

import {
  ChevronDown,
  LogOut,
  MapPin,
  Package,
  User,
} from "lucide-react";

interface CustomerAccountMenuProps {
  customerName: string;
  customerInitial: string;
}

export function CustomerAccountMenu({
  customerName,
  customerInitial,
}: CustomerAccountMenuProps) {
  const [isOpen, setIsOpen] =
    useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement>(null);

  /**
   * ============================================================
   * CLOSE MENU WHEN CLICKING OUTSIDE
   * ============================================================
   */

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /**
   * ============================================================
   * CLOSE MENU WITH ESCAPE
   * ============================================================
   */

  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  /**
   * ============================================================
   * HANDLE LOGOUT
   * ============================================================
   */

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);

      await signOut({
        callbackUrl: "/login",
      });
    } catch (error) {
      console.error(
        "[CUSTOMER_LOGOUT_ERROR]",
        error
      );

      setIsLoggingOut(false);
    }
  };

  return (
    <div
      ref={menuRef}
      className="relative ml-1"
    >
      {/* ========================================================
          ACCOUNT BUTTON
      ======================================================== */}

      <button
        type="button"
        onClick={() =>
          setIsOpen((current) => !current)
        }
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border bg-white py-1 pl-1 pr-3 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
          {customerInitial}
        </div>

        <span className="hidden max-w-24 truncate text-sm font-medium sm:block">
          {customerName}
        </span>

        <ChevronDown
          className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${
            isOpen
              ? "rotate-180"
              : ""
          }`}
        />
      </button>

      {/* ========================================================
          DROPDOWN MENU
      ======================================================== */}

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-100 mt-3 w-60 overflow-hidden rounded-2xl border bg-white p-2 shadow-xl"
        >
          {/* ====================================================
              ACCOUNT HEADER
          ==================================================== */}

          <div className="px-3 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Akun
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-slate-900">
              {customerName}
            </p>
          </div>

          <div className="my-1 border-t" />

          {/* ====================================================
              PROFILE
          ==================================================== */}

          <Link
            href="/customer/account"
            onClick={() =>
              setIsOpen(false)
            }
            role="menuitem"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <User className="h-4 w-4" />

            <span>
              Profil
            </span>
          </Link>

          {/* ====================================================
              ADDRESS
          ==================================================== */}

          <Link
            href="/customer/addresses"
            onClick={() =>
              setIsOpen(false)
            }
            role="menuitem"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <MapPin className="h-4 w-4" />

            <span>
              Alamat
            </span>
          </Link>

          {/* ====================================================
              ORDERS
          ==================================================== */}

          <Link
            href="/customer/orders"
            onClick={() =>
              setIsOpen(false)
            }
            role="menuitem"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Package className="h-4 w-4" />

            <span>
              Pesanan
            </span>
          </Link>

          <div className="my-1 border-t" />

          {/* ====================================================
              LOGOUT
          ==================================================== */}

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            role="menuitem"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />

            <span>
              {isLoggingOut
                ? "Keluar..."
                : "Logout"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}