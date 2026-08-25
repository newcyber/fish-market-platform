import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * ============================================================
 * PUBLIC ROUTES
 * ============================================================
 *
 * Route yang dapat diakses tanpa login.
 */

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/login-required",
];

/**
 * ============================================================
 * AUTH ROUTES
 * ============================================================
 *
 * Route autentikasi.
 *
 * Jika user sudah login, akses ke halaman login/register
 * akan diarahkan ke area sesuai role.
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

const ADMIN_PREFIX =
  "/admin";

const CUSTOMER_PREFIX =
  "/customer";

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
 * ROOT "/":
 * - Selalu dapat diakses
 * - Tidak redirect ke login
 * - Tidak redirect ke /customer
 * - Tidak redirect ke /admin
 *
 * ============================================================
 */

export default auth(
  (req) => {
    const {
      nextUrl,
    } = req;

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
     * ROOT HOMEPAGE
     * ==========================================================
     *
     * Homepage selalu public.
     */

    if (
      pathname === "/"
    ) {
      return NextResponse.next();
    }

    /**
     * ==========================================================
     * LOGIN REQUIRED PAGE
     * ==========================================================
     *
     * Halaman pemberitahuan login.
     *
     * Guest:
     *   boleh masuk.
     *
     * User yang sudah login:
     *   tidak perlu melihat halaman ini lagi.
     */

    if (
      pathname ===
      "/login-required"
    ) {
      if (
        isLoggedIn
      ) {
        return NextResponse.redirect(
          new URL(
            "/customer",
            nextUrl
          )
        );
      }

      return NextResponse.next();
    }

    /**
     * ==========================================================
     * AUTH ROUTES
     * ==========================================================
     *
     * Login dan Register dapat diakses guest.
     *
     * Jika sudah login:
     *
     * ADMIN / SUPER_ADMIN
     * -> /admin
     *
     * CUSTOMER
     * -> /customer
     */

    if (
      AUTH_ROUTES.includes(
        pathname
      )
    ) {
      /**
       * Guest
       */

      if (
        !isLoggedIn
      ) {
        return NextResponse.next();
      }

      /**
       * USER NONAKTIF
       */

      if (
        user?.isActive === false
      ) {
        return NextResponse.next();
      }

      /**
       * ADMIN
       */

      if (
        role ===
          "SUPER_ADMIN" ||
        role ===
          "ADMIN"
      ) {
        return NextResponse.redirect(
          new URL(
            "/admin",
            nextUrl
          )
        );
      }

      /**
       * CUSTOMER
       */

      if (
        role ===
        "CUSTOMER"
      ) {
        return NextResponse.redirect(
          new URL(
            "/customer",
            nextUrl
          )
        );
      }

      return NextResponse.next();
    }

    /**
     * ==========================================================
     * OTHER PUBLIC ROUTES
     * ==========================================================
     */

    if (
      PUBLIC_ROUTES.includes(
        pathname
      )
    ) {
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
     * Hanya dapat diakses oleh:
     *
     * - ADMIN
     * - SUPER_ADMIN
     */

    if (
      pathname.startsWith(
        ADMIN_PREFIX
      )
    ) {
      /**
       * BELUM LOGIN
       */

      if (
        !isLoggedIn
      ) {
        return NextResponse.redirect(
          new URL(
            "/login",
            nextUrl
          )
        );
      }

      /**
       * USER NONAKTIF
       */

      if (
        user?.isActive === false
      ) {
        return NextResponse.redirect(
          new URL(
            "/login",
            nextUrl
          )
        );
      }

      /**
       * BUKAN ADMIN
       */

      if (
        role !==
          "SUPER_ADMIN" &&
        role !==
          "ADMIN"
      ) {
        return NextResponse.redirect(
          new URL(
            "/customer",
            nextUrl
          )
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
     * Hanya dapat diakses oleh:
     *
     * - CUSTOMER
     */

    if (
      pathname.startsWith(
        CUSTOMER_PREFIX
      )
    ) {
      /**
       * ========================================================
       * BELUM LOGIN
       * ========================================================
       *
       * Jangan langsung ke /login.
       *
       * Simpan halaman yang ingin dibuka:
       *
       * /login-required?callbackUrl=/customer/cart
       *
       * Setelah login berhasil,
       * user akan dikembalikan ke halaman tersebut.
       */

      if (
        !isLoggedIn
      ) {
        const loginRequiredUrl =
          new URL(
            "/login-required",
            nextUrl
          );

        const callbackUrl =
          `${nextUrl.pathname}${nextUrl.search}`;

        loginRequiredUrl.searchParams.set(
          "callbackUrl",
          callbackUrl
        );

        return NextResponse.redirect(
          loginRequiredUrl
        );
      }

      /**
       * ========================================================
       * USER NONAKTIF
       * ========================================================
       *
       * User nonaktif tetap diarahkan
       * ke login.
       */

      if (
        user?.isActive === false
      ) {
        return NextResponse.redirect(
          new URL(
            "/login",
            nextUrl
          )
        );
      }

      /**
       * ========================================================
       * JIKA ADMIN MASUK KE AREA CUSTOMER
       * ========================================================
       */

      if (
        role ===
          "SUPER_ADMIN" ||
        role ===
          "ADMIN"
      ) {
        return NextResponse.redirect(
          new URL(
            "/admin",
            nextUrl
          )
        );
      }

      /**
       * ========================================================
       * ROLE BUKAN CUSTOMER
       * ========================================================
       */

      if (
        role !==
        "CUSTOMER"
      ) {
        return NextResponse.redirect(
          new URL(
            "/login",
            nextUrl
          )
        );
      }

      return NextResponse.next();
    }

    /**
     * ==========================================================
     * DEFAULT
     * ==========================================================
     */

    return NextResponse.next();
  }
);

/**
 * ============================================================
 * MATCHER
 * ============================================================
 */

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};