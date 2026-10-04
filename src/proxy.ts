import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Public storefront routes.
 */
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/login-required",
  "/products",
];

const PUBLIC_ROUTE_PREFIXES = ["/products"];

const AUTH_ROUTES = ["/login", "/register"];

const ADMIN_PREFIX = "/admin";
const ADMIN_COURIER_PREFIX = "/admin/couriers";
const COURIER_PREFIX = "/courier";
const CUSTOMER_PREFIX = "/customer";

function isPublicRoute(pathname: string) {
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }

  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAdminCourierRoute(pathname: string) {
  return (
    pathname === ADMIN_COURIER_PREFIX ||
    pathname.startsWith(`${ADMIN_COURIER_PREFIX}/`)
  );
}

function isCourierRoute(pathname: string) {
  return pathname === COURIER_PREFIX || pathname.startsWith(`${COURIER_PREFIX}/`);
}

function redirectByRole(
  role: string | undefined,
  nextUrl: URL,
) {
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }

  if (role === "COURIER") {
    return NextResponse.redirect(new URL("/courier", nextUrl));
  }

  if (role === "CUSTOMER") {
    return NextResponse.redirect(new URL("/customer", nextUrl));
  }

  return NextResponse.next();
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = Boolean(req.auth);
  const user = req.auth?.user;
  const role = user?.role;

  /**
   * Homepage is public for every role.
   */
  if (pathname === "/") {
    return NextResponse.next();
  }

  /**
   * Storefront/product pages remain public.
   */
  if (isPublicRoute(pathname) && !AUTH_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  /**
   * Login-required is only useful for guests.
   */
  if (pathname === "/login-required") {
    if (!isLoggedIn) {
      return NextResponse.next();
    }

    return redirectByRole(role, nextUrl);
  }

  /**
   * Auth pages: logged-in users should never land back on login/register.
   */
  if (AUTH_ROUTES.includes(pathname)) {
    if (!isLoggedIn) {
      return NextResponse.next();
    }

    if (user?.isActive === false) {
      return NextResponse.next();
    }

    return redirectByRole(role, nextUrl);
  }

  /**
   * Dedicated courier operational area.
   * Only an active COURIER can enter this area.
   */
  if (isCourierRoute(pathname)) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    if (user?.isActive === false) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    if (role === "COURIER") {
      return NextResponse.next();
    }

    return redirectByRole(role, nextUrl);
  }

  /**
   * Admin dispatch page remains available to admins only.
   * /admin/couriers is an admin assignment/dispatch center,
   * not the courier's operational dashboard.
   */
  if (isAdminCourierRoute(pathname)) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    if (user?.isActive === false) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      return NextResponse.next();
    }

    if (role === "COURIER") {
      return NextResponse.redirect(new URL("/courier", nextUrl));
    }

    if (role === "CUSTOMER") {
      return NextResponse.redirect(new URL("/customer", nextUrl));
    }

    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  /**
   * Admin area: ADMIN and SUPER_ADMIN only.
   */
  if (pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`)) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    if (user?.isActive === false) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      return NextResponse.next();
    }

    if (role === "COURIER") {
      return NextResponse.redirect(new URL("/courier", nextUrl));
    }

    if (role === "CUSTOMER") {
      return NextResponse.redirect(new URL("/customer", nextUrl));
    }

    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  /**
   * Customer area: CUSTOMER only.
   */
  if (pathname === CUSTOMER_PREFIX || pathname.startsWith(`${CUSTOMER_PREFIX}/`)) {
    if (!isLoggedIn) {
      const loginRequiredUrl = new URL("/login-required", nextUrl);
      loginRequiredUrl.searchParams.set(
        "callbackUrl",
        `${nextUrl.pathname}${nextUrl.search}`,
      );
      return NextResponse.redirect(loginRequiredUrl);
    }

    if (user?.isActive === false) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    if (role === "CUSTOMER") {
      return NextResponse.next();
    }

    return redirectByRole(role, nextUrl);
  }

  return NextResponse.next();
});
