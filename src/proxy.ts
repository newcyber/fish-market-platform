import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
];

const AUTH_ROUTES = [
  "/login",
  "/register",
];

const ADMIN_PREFIX = "/admin";

const CUSTOMER_PREFIX = "/customer";

/**
 * ============================================================
 * PROXY
 * ============================================================
 *
 * Proteksi route berdasarkan:
 * - Authentication
 * - User active status
 * - User role
 *
 * ============================================================
 */

export default auth((req) => {
  const { nextUrl } = req;

  const pathname =
    nextUrl.pathname;

  const isLoggedIn =
    Boolean(req.auth);

  const user =
    req.auth?.user;

  const role =
    user?.role;

  /**
   * ==========================================================
   * ROOT GATEWAY
   * ==========================================================
   */

  if (pathname === "/") {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL("/login", nextUrl)
      );
    }

    if (
      role === "SUPER_ADMIN" ||
      role === "ADMIN"
    ) {
      return NextResponse.redirect(
        new URL("/admin", nextUrl)
      );
    }

    return NextResponse.redirect(
      new URL("/customer", nextUrl)
    );
  }

  /**
   * ==========================================================
   * AUTH ROUTES
   * ==========================================================
   */

  if (AUTH_ROUTES.includes(pathname)) {
    if (!isLoggedIn) {
      return NextResponse.next();
    }

    if (
      role === "SUPER_ADMIN" ||
      role === "ADMIN"
    ) {
      return NextResponse.redirect(
        new URL("/admin", nextUrl)
      );
    }

    return NextResponse.redirect(
      new URL("/customer", nextUrl)
    );
  }

  /**
   * ==========================================================
   * PUBLIC ROUTES
   * ==========================================================
   */

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  /**
   * ==========================================================
   * AUTHENTICATION REQUIRED
   * ==========================================================
   */

  if (!isLoggedIn) {
    return NextResponse.redirect(
      new URL("/login", nextUrl)
    );
  }

  /**
   * ==========================================================
   * USER ACTIVE CHECK
   * ==========================================================
   *
   * Jika session sudah menandakan user nonaktif,
   * akses langsung ditolak.
   */

  if (user?.isActive === false) {
    return NextResponse.redirect(
      new URL("/login", nextUrl)
    );
  }

  /**
   * ==========================================================
   * ADMIN AREA
   * ==========================================================
   */

  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (
      role !== "SUPER_ADMIN" &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(
        new URL("/customer", nextUrl)
      );
    }
  }

  /**
   * ==========================================================
   * CUSTOMER AREA
   * ==========================================================
   */

  if (pathname.startsWith(CUSTOMER_PREFIX)) {
    if (role !== "CUSTOMER") {
      return NextResponse.redirect(
        new URL("/admin", nextUrl)
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};