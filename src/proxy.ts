import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * ============================================================
 * PUBLIC ROUTES
 * ============================================================
 *
 * Route yang dapat diakses tanpa login.
 *
 * Route storefront/product juga termasuk public karena:
 *
 * - Guest dapat melihat produk
 * - Customer dapat melihat produk
 * - ADMIN dapat melihat produk
 * - SUPER_ADMIN dapat melihat produk
 *
 * Session user tetap dipertahankan.
 */

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/login-required",
  "/products",
];

/**
 * ============================================================
 * PUBLIC ROUTE PREFIXES
 * ============================================================
 *
 * Prefix yang seluruh turunannya bersifat public.
 *
 * Contoh:
 *
 * /products
 * /products/ikan-bandeng
 * /products/ikan-kakap
 *
 * semuanya dapat diakses tanpa login.
 */

const PUBLIC_ROUTE_PREFIXES = [
  "/products",
];

/**
 * ============================================================
 * AUTH ROUTES
 * ============================================================
 *
 * Route autentikasi.
 *
 * Jika user sudah login:
 *
 * ADMIN / SUPER_ADMIN
 * -> /admin
 *
 * CUSTOMER
 * -> /customer
 */

const AUTH_ROUTES = [
  "/login",
  "/register",
];

/**
 * ============================================================
 * ROUTE PREFIX
 * ============================================================
 */

const ADMIN_PREFIX = "/admin";

const CUSTOMER_PREFIX = "/customer";

/**
 * ============================================================
 * HELPER
 * ============================================================
 *
 * Memastikan prefix tidak salah mencocokkan route.
 *
 * Contoh:
 *
 * /products
 * /products/ikan
 *
 * cocok.
 *
 * Tetapi:
 *
 * /products-old
 *
 * tidak cocok.
 */

function isPublicRoute(pathname: string) {
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }

  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(`${prefix}/`),
  );
}

/**
 * ============================================================
 * PROXY
 * ============================================================
 *
 * Proteksi route berdasarkan:
 *
 * - Authentication
 * - User active status
 * - User role
 *
 * Aturan utama:
 *
 * GUEST
 *   -> Homepage
 *   -> Product
 *   -> Public routes
 *
 * CUSTOMER
 *   -> Homepage
 *   -> Product
 *   -> Customer area
 *
 * ADMIN
 *   -> Homepage
 *   -> Product
 *   -> Admin area
 *
 * SUPER_ADMIN
 *   -> Homepage
 *   -> Product
 *   -> Admin area
 *
 * ADMIN / SUPER_ADMIN tidak dipaksa masuk
 * ke /customer ketika browsing storefront.
 *
 * ============================================================
 */

export default auth((req) => {
  const { nextUrl } = req;

  const pathname = nextUrl.pathname;

  const isLoggedIn = Boolean(req.auth);

  const user = req.auth?.user;

  const role = user?.role;

  /**
   * ==========================================================
   * ROOT HOMEPAGE
   * ==========================================================
   *
   * Homepage selalu public.
   *
   * Jangan redirect berdasarkan role.
   *
   * ADMIN tetap dapat melihat homepage.
   * SUPER_ADMIN tetap dapat melihat homepage.
   * CUSTOMER tetap dapat melihat homepage.
   * Guest tetap dapat melihat homepage.
   */

  if (pathname === "/") {
    return NextResponse.next();
  }

  /**
   * ==========================================================
   * PUBLIC STOREFRONT
   * ==========================================================
   *
   * Contoh:
   *
   * /products
   * /products/ikan-bandeng
   *
   * Semua role dapat mengakses.
   *
   * Tidak boleh redirect:
   *
   * ADMIN -> /admin
   * SUPER_ADMIN -> /admin
   * CUSTOMER -> /customer
   *
   * Karena user memang sedang browsing storefront.
   */

  if (isPublicRoute(pathname)) {
    /**
     * Login/register diproses
     * pada blok AUTH_ROUTES di bawah.
     */

    if (!AUTH_ROUTES.includes(pathname)) {
      return NextResponse.next();
    }
  }

  /**
   * ==========================================================
   * LOGIN REQUIRED PAGE
   * ==========================================================
   *
   * Guest:
   *   boleh masuk.
   *
   * User login:
   *   halaman ini tidak diperlukan lagi.
   */

  if (pathname === "/login-required") {
    if (isLoggedIn) {
      /**
       * Jika user adalah admin,
       * arahkan ke dashboard admin.
       */

      if (
        role === "SUPER_ADMIN" ||
        role === "ADMIN"
      ) {
        return NextResponse.redirect(
          new URL("/admin", nextUrl),
        );
      }

      /**
       * Customer tetap diarahkan
       * ke customer area.
       */

      if (role === "CUSTOMER") {
        return NextResponse.redirect(
          new URL("/customer", nextUrl),
        );
      }
    }

    return NextResponse.next();
  }

  /**
   * ==========================================================
   * AUTH ROUTES
   * ==========================================================
   *
   * /login
   * /register
   */

  if (AUTH_ROUTES.includes(pathname)) {
    /**
     * Guest boleh membuka login/register.
     */

    if (!isLoggedIn) {
      return NextResponse.next();
    }

    /**
     * User nonaktif tidak dipaksa redirect
     * berdasarkan role.
     *
     * Hal ini memungkinkan halaman login
     * menangani status akun.
     */

    if (user?.isActive === false) {
      return NextResponse.next();
    }

    /**
     * ADMIN / SUPER_ADMIN
     */

    if (
      role === "SUPER_ADMIN" ||
      role === "ADMIN"
    ) {
      return NextResponse.redirect(
        new URL("/admin", nextUrl),
      );
    }

    /**
     * CUSTOMER
     */

    if (role === "CUSTOMER") {
      return NextResponse.redirect(
        new URL("/customer", nextUrl),
      );
    }

    return NextResponse.next();
  }

  /**
   * ==========================================================
   * ADMIN AREA
   * ==========================================================
   *
   * /admin
   * /admin/...
   *
   * Hanya:
   *
   * - ADMIN
   * - SUPER_ADMIN
   *
   * yang boleh masuk.
   *
   * Catatan:
   *
   * Proteksi SUPER_ADMIN khusus seperti:
   *
   * /admin/settings
   *
   * tetap dilakukan oleh:
   *
   * requireSuperAdmin()
   *
   * pada Server Component / Server Action.
   */

  if (pathname.startsWith(ADMIN_PREFIX)) {
    /**
     * BELUM LOGIN
     */

    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL("/login", nextUrl),
      );
    }

    /**
     * USER NONAKTIF
     */

    if (user?.isActive === false) {
      return NextResponse.redirect(
        new URL("/login", nextUrl),
      );
    }

    /**
     * BUKAN ADMIN
     */

    if (
      role !== "SUPER_ADMIN" &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(
        new URL("/customer", nextUrl),
      );
    }

    return NextResponse.next();
  }

  /**
   * ==========================================================
   * CUSTOMER AREA
   * ==========================================================
   *
   * /customer
   * /customer/...
   *
   * Hanya CUSTOMER.
   *
   * ADMIN / SUPER_ADMIN tidak menggunakan area customer.
   */

  if (pathname.startsWith(CUSTOMER_PREFIX)) {
    /**
     * BELUM LOGIN
     *
     * Simpan halaman yang ingin dibuka.
     */

    if (!isLoggedIn) {
      const loginRequiredUrl = new URL(
        "/login-required",
        nextUrl,
      );

      const callbackUrl =
        `${nextUrl.pathname}${nextUrl.search}`;

      loginRequiredUrl.searchParams.set(
        "callbackUrl",
        callbackUrl,
      );

      return NextResponse.redirect(
        loginRequiredUrl,
      );
    }

    /**
     * USER NONAKTIF
     */

    if (user?.isActive === false) {
      return NextResponse.redirect(
        new URL("/login", nextUrl),
      );
    }

    /**
     * ADMIN / SUPER_ADMIN
     *
     * Tidak boleh menggunakan customer area.
     */

    if (
      role === "SUPER_ADMIN" ||
      role === "ADMIN"
    ) {
      return NextResponse.redirect(
        new URL("/admin", nextUrl),
      );
    }

    /**
     * ROLE BUKAN CUSTOMER
     */

    if (role !== "CUSTOMER") {
      return NextResponse.redirect(
        new URL("/login", nextUrl),
      );
    }

    return NextResponse.next();
  }

  /**
   * ==========================================================
   * DEFAULT
   * ==========================================================
   *
   * Route lain tidak diblokir oleh proxy.
   *
   * Authorization khusus tetap harus dilakukan
   * di Server Component / Server Action / API route
   * sesuai kebutuhan masing-masing.
   */

  return NextResponse.next();
});