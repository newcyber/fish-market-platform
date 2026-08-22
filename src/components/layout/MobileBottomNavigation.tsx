"use client";

/**
 * ============================================================
 * MOBILE BOTTOM NAVIGATION
 * ============================================================
 *
 * Tampil pada:
 * - /
 * - /products
 * - /products/[slug]
 * - /customer/*
 *
 * Tidak tampil pada:
 * - /admin
 * - /admin/*
 * - /login
 * - /register
 * - /forgot-password
 * - /reset-password
 * - /verify-email
 *
 * Cart count diambil secara global dari:
 * GET /api/cart/count
 * ============================================================
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  useSession,
} from "next-auth/react";

import {
  Headphones,
  Home,
  LayoutGrid,
  ShoppingCart,
  User,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

type NavigationItem = {
  label: string;
  href: string;

  icon: React.ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>;

  isActive: (
    pathname: string
  ) => boolean;

  isExternal?: boolean;
};

type CartCountResponse = {
  success?: boolean;
  count?: number;
  message?: string;
};

type ContactSettingsResponse = {
  success?: boolean;

  whatsapp?: string | null;

  message?: string;
};

/**
 * ============================================================
 * MOBILE BOTTOM NAVIGATION
 * ============================================================
 */

/**
 * ============================================================
 * NORMALIZE WHATSAPP NUMBER
 * ============================================================
 *
 * Menerima berbagai format:
 *
 * 081234567890
 * 6281234567890
 * +6281234567890
 * 62 812-3456-7890
 *
 * Menghasilkan format:
 *
 * 6281234567890
 */

function normalizeWhatsAppNumber(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return null;
  }

  let number =
    value.replace(
      /\D/g,
      ""
    );

  if (!number) {
    return null;
  }

  /**
   * Format Indonesia:
   *
   * 0812...
   * menjadi
   * 62812...
   */
  if (
    number.startsWith(
      "0"
    )
  ) {
    number =
      `62${number.slice(1)}`;
  }

  /**
   * Jika user memasukkan nomor
   * tanpa prefix negara.
   */
  if (
    number.startsWith(
      "8"
    )
  ) {
    number =
      `62${number}`;
  }

  return number;
}

export default function MobileBottomNavigation() {
  const rawPathname =
    usePathname() ?? "";

  /**
   * ==========================================================
   * AUTH SESSION
   * ==========================================================
   */

  const {
    status,
  } = useSession();

  /**
   * ==========================================================
   * NORMALIZE PATHNAME
   * ==========================================================
   *
   * Contoh:
   *
   * /admin/
   * menjadi
   * /admin
   *
   * Agar route guard tetap bekerja dengan konsisten.
   */

  const pathname =
    rawPathname
      .trim()
      .replace(/\/+$/, "") || "/";

  const [
    cartCount,
    setCartCount,
  ] = useState(0);

  const [
  whatsappNumber,
  setWhatsappNumber,
] = useState<string | null>(
  null
);

  /**
   * ==========================================================
   * SCROLL VISIBILITY STATE
   * ==========================================================
   *
   * Scroll down → hide navigation
   * Scroll up   → show navigation
   */

  const [
    isNavigationVisible,
    setIsNavigationVisible,
  ] = useState(true);


  const [
  isScrolled,
  setIsScrolled,
] = useState(false);

  const lastScrollYRef =
    useRef(0);

  const tickingRef =
    useRef(false);


  /**
   * ==========================================================
   * ROUTE GUARD
   * ==========================================================
   */

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  const isLoginRoute =
    pathname === "/login" ||
    pathname.startsWith("/login/");

  const isRegisterRoute =
    pathname === "/register" ||
    pathname.startsWith("/register/");

  const isForgotPasswordRoute =
    pathname === "/forgot-password" ||
    pathname.startsWith(
      "/forgot-password/"
    );

  const isResetPasswordRoute =
    pathname === "/reset-password" ||
    pathname.startsWith(
      "/reset-password/"
    );

  const isVerifyEmailRoute =
    pathname === "/verify-email" ||
    pathname.startsWith(
      "/verify-email/"
    );

  const shouldHideNavigation =
    isAdminRoute ||
    isLoginRoute ||
    isRegisterRoute ||
    isForgotPasswordRoute ||
    isResetPasswordRoute ||
    isVerifyEmailRoute;



  /**
   * ==========================================================
   * LOAD CART COUNT
   * ==========================================================
   */

  const loadCartCount =
    useCallback(
      async () => {
        try {
          const response =
            await fetch(
              "/api/cart/count",
              {
                method: "GET",

                headers: {
                  Accept:
                    "application/json",
                },

                cache: "no-store",
              }
            );

          if (!response.ok) {
            return;
          }

          const result:
            CartCountResponse =
              await response.json();

          if (!result.success) {
            return;
          }

          const nextCount =
            Number(
              result.count ?? 0
            );

          setCartCount(
            Number.isFinite(
              nextCount
            )
              ? Math.max(
                  0,
                  nextCount
                )
              : 0
          );
        } catch (error) {
          /**
           * Cart badge bukan fitur kritikal.
           * Error hanya dicatat di console.
           */

          console.error(
            "[MOBILE_NAV_CART_COUNT_ERROR]",
            error
          );
        }
      },
      []
    );

    /**
 * ==========================================================
 * LOAD CONTACT SETTINGS
 * ==========================================================
 *
 * Mengambil nomor WhatsApp langsung dari
 * Admin Settings.
 */

const loadContactSettings =
  useCallback(
    async () => {
      try {
        const response =
          await fetch(
            "/api/settings/contact",
            {
              method: "GET",

              headers: {
                Accept:
                  "application/json",
              },

              cache:
                "no-store",
            }
          );

        if (!response.ok) {
          return;
        }

        const result:
          ContactSettingsResponse =
          await response.json();

        if (!result.success) {
          return;
        }

        const normalizedNumber =
          normalizeWhatsAppNumber(
            result.whatsapp
          );

        setWhatsappNumber(
          normalizedNumber
        );
      } catch (error) {
        console.error(
          "[MOBILE_NAV_CONTACT_ERROR]",
          error
        );
      }
    },
    []
  );
  
  /**
   * ==========================================================
   * LOAD CART COUNT
   * ==========================================================
   *
   * Dijalankan ketika:
   * - Component pertama kali aktif
   * - User berpindah halaman / pathname berubah
   *
   * Menggunakan setTimeout agar tidak melakukan
   * state update secara synchronous langsung
   * dari body useEffect.
   */

  useEffect(
    () => {
      let isCancelled = false;

      const timer =
        window.setTimeout(
          () => {
            if (
              !isCancelled &&
              !shouldHideNavigation
            ) {
              void loadCartCount();
            }
          },
          0
        );

      return () => {
        isCancelled = true;

        window.clearTimeout(
          timer
        );
      };
    },
    [
      pathname,
      shouldHideNavigation,
      loadCartCount,
    ]
  );

  /**
 * ==========================================================
 * LOAD CONTACT SETTINGS ON MOUNT
 * ==========================================================
 */

useEffect(
  () => {
    if (shouldHideNavigation) {
      return;
    }

    let isCancelled = false;

    const timer =
      window.setTimeout(
        () => {
          if (!isCancelled) {
            void loadContactSettings();
          }
        },
        0
      );

    return () => {
      isCancelled = true;

      window.clearTimeout(
        timer
      );
    };
  },
  [
    shouldHideNavigation,
    loadContactSettings,
  ]
);

  /**
   * ==========================================================
   * REFRESH WHEN TAB BECOMES ACTIVE
   * ==========================================================
   */

  useEffect(
    () => {
      if (
        shouldHideNavigation
      ) {
        return;
      }


      function handleVisibilityChange() {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void loadCartCount();
        }
      }

      function handleWindowFocus() {
        void loadCartCount();
      }

      window.addEventListener(
        "focus",
        handleWindowFocus
      );

      document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      return () => {
        window.removeEventListener(
          "focus",
          handleWindowFocus
        );

        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    },
    [
      shouldHideNavigation,
      loadCartCount,
    ]
  );

  /**
 * ==========================================================
 * REFRESH CART BADGE AFTER CART UPDATE
 * ==========================================================
 *
 * Event ini dipanggil setiap kali customer berhasil:
 *
 * - Menambahkan produk ke cart
 * - Dan nantinya dapat digunakan juga untuk:
 *   - update quantity
 *   - hapus cart item
 *
 * Mobile Bottom Navigation akan langsung mengambil
 * jumlah cart terbaru tanpa perlu pindah halaman.
 */

useEffect(
  () => {
    function handleCartUpdated() {
      void loadCartCount();
    }

    window.addEventListener(
      "cart-updated",
      handleCartUpdated
    );

    return () => {
      window.removeEventListener(
        "cart-updated",
        handleCartUpdated
      );
    };
  },
  [
    loadCartCount,
  ]
);

  /**
   * ==========================================================
   * HIDE / SHOW ON SCROLL
   * ==========================================================
   *
   * UX:
   *
   * - Scroll down → hide
   * - Scroll up → show
   * - Near top → always show
   *
   * Tiny movement is ignored to avoid flickering.
   */

  /**
 * ==========================================================
 * HIDE / SHOW ON SCROLL
 * ==========================================================
 *
 * UX:
 *
 * - Scroll down → hide
 * - Scroll up → show
 * - Near top → always show
 *
 * Tiny movement is ignored to avoid flickering.
 */

useEffect(
  () => {
    if (shouldHideNavigation) {
      return;
    }

    const initialScrollY =
      window.scrollY;

    lastScrollYRef.current =
      initialScrollY;

    function updateNavigationVisibility() {
      const currentScrollY =
        window.scrollY;

      const lastScrollY =
        lastScrollYRef.current;

      const scrollDifference =
        currentScrollY -
        lastScrollY;


      const nextScrolledState =
        currentScrollY > 24;

      setIsScrolled(
        (previous) =>
          previous === nextScrolledState
            ? previous
            : nextScrolledState
      );

      /**
       * Always show near the top.
       */
      if (currentScrollY <= 24) {
        setIsNavigationVisible(
          (previous) =>
            previous === true
              ? previous
              : true
        );

        lastScrollYRef.current =
          currentScrollY;

        tickingRef.current =
          false;

        return;
      }

      /**
       * Ignore tiny touch movement.
       */
      if (
        Math.abs(scrollDifference) < 8
      ) {
        tickingRef.current =
          false;

        return;
      }

      /**
       * Scroll down → hide.
       * Scroll up → show.
       */
      const nextVisibility =
        scrollDifference < 0;

      setIsNavigationVisible(
        (previous) =>
          previous === nextVisibility
            ? previous
            : nextVisibility
      );

      lastScrollYRef.current =
        currentScrollY;

      tickingRef.current =
        false;
    }

    function handleScroll() {
      if (tickingRef.current) {
        return;
      }

      tickingRef.current =
        true;

      window.requestAnimationFrame(
        updateNavigationVisibility
      );
    }

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );

      tickingRef.current =
        false;
    };
  },
  [
    shouldHideNavigation,
  ]
);

  /**
   * ==========================================================
   * HIDE NAVIGATION
   * ==========================================================
   *
   * Sangat penting:
   *
   * Return null dilakukan setelah semua hooks.
   * Jangan meletakkan return null sebelum useEffect
   * karena akan melanggar Rules of Hooks saat route berubah.
   */

  if (
    shouldHideNavigation
  ) {
    return null;
  }

  
      /**
   * ==========================================================
   * FORMAT CART COUNT
   * ==========================================================
   */

  const formattedCartCount =
    cartCount > 99
      ? "99+"
      : String(
          cartCount
        );

        /**
 * ==========================================================
 * WHATSAPP URL
 * ==========================================================
 */

const whatsappUrl =
  whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : "#";


  /**
   * ==========================================================
   * ACCOUNT URL
   * ==========================================================
   */

  const accountUrl =
    status === "authenticated"
      ? "/customer/profile"
      : "/login";

  /**
   * ==========================================================
   * NAVIGATION ITEMS
   * ==========================================================
   */

  const navigationItems:
    NavigationItem[] = [
      {
        label: "Home",
        href: "/",
        icon: Home,

        isActive: (
          currentPathname
        ) =>
          currentPathname === "/" ||
          currentPathname ===
            "/customer/profile",
      },

      {
  label: "Kategori",
  href: "/products?category=all#categories",
  icon: LayoutGrid,

  isActive: (
    currentPathname
  ) =>
    currentPathname ===
      "/products" ||
    currentPathname.startsWith(
      "/products/"
    ) ||
    currentPathname ===
      "/customer/products" ||
    currentPathname.startsWith(
      "/customer/products/"
    ),
},

      {
  label: "Chat CS",

  href:
    whatsappUrl,

  icon: Headphones,

  isExternal:
    Boolean(
      whatsappNumber
    ),

  isActive: () =>
    false,
},

      {
        label: "Keranjang",
        href: "/customer/cart",
        icon: ShoppingCart,

        isActive: (
          currentPathname
        ) =>
          currentPathname ===
            "/customer/cart",
      },

      {
        label: "Akun",
        href: accountUrl,
        icon: User,

        isActive: (
          currentPathname
        ) =>
          currentPathname ===
            "/customer" ||
          currentPathname.startsWith(
            "/customer/profile"
          ) ||
          currentPathname.startsWith(
            "/customer/addresses"
          ) ||
          currentPathname.startsWith(
            "/customer/orders"
          ) ||
          currentPathname.startsWith(
            "/customer/wishlist"
          ),
      },
    ];

  /**
   * ==========================================================
   * ACTIVE NAVIGATION INDEX
   * ==========================================================
   *
   * A single indicator moves between the five navigation slots.
   */

  const activeNavigationIndex =
    navigationItems.findIndex(
      (item) =>
        item.isActive(
          pathname
        )
    );

  const slidingIndicatorIndex =
    activeNavigationIndex >= 0
      ? activeNavigationIndex
      : 0;

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <>
      <nav
        aria-label="Navigasi utama mobile"
        className={`
          fixed
          inset-x-0
          bottom-0
          z-100

          origin-bottom
          transform-gpu
          will-change-[transform,opacity]
          transition-[transform,opacity]
          duration-500
          ease-[cubic-bezier(0.22,1,0.36,1)]

          ${
            isNavigationVisible
              ? `
                translate-y-0
                scale-100
                opacity-100
              `
              : `
                translate-y-[calc(100%+env(safe-area-inset-bottom))]
                scale-[0.96]
                opacity-0
              `
          }

          motion-reduce:transition-none

          border-t
          px-1.5
          pt-1.5
          transition-[background-color,border-color,box-shadow,backdrop-filter]
          duration-300
          ease-out

          ${
            isScrolled
              ? `
                border-slate-200/80
                bg-white/95
                shadow-[0_-14px_40px_rgba(15,23,42,0.14)]
                backdrop-blur-2xl
              `
              : `
                border-white/45
                bg-white/72
                shadow-[0_-8px_28px_rgba(15,23,42,0.07)]
                backdrop-blur-xl
              `
          }

          md:hidden
        `}
      >
        <div
          className="
            mx-auto
            relative
            grid
            h-[4.35rem]
            max-w-lg
            grid-cols-5
            items-stretch
          "
        >
          {/* ==================================================
              SLIDING ACTIVE INDICATOR
              ================================================== */}

          <span
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              left-0
              top-0
              h-1
              w-1/5
              rounded-full
              bg-[#78a94f]
              shadow-[0_2px_10px_rgba(95,145,60,0.38)]
              transition-transform
              duration-500
              ease-[cubic-bezier(0.22,1,0.36,1)]
              motion-reduce:transition-none
            "
            style={{
              transform:
                `translateX(${slidingIndicatorIndex * 100}%)`,
            }}
          />

          {navigationItems.map(
            (item) => {
              const Icon =
                item.icon;

              const isActive =
                item.isActive(
                  pathname
                );

              const content = (
                <>
                  <span
                    className={`
                      relative
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-2xl
                      transition-all
                      duration-300
                      ease-out
                      ${
                        isActive
                          ? `
                            -translate-y-0.5
                            scale-100
                            bg-[#eaf4df]
                            text-[#5f913c]
                            shadow-[0_8px_18px_rgba(95,145,60,0.14)]
                          `
                          : `
                            translate-y-0
                            scale-95
                            bg-transparent
                            text-slate-500
                          `
                      }
                    `}
                  >
                    {/* Active indicator */}
                    <span
                      aria-hidden="true"
                      className={`
                        absolute
                        inset-x-2.5
                        -top-1.5
                        h-1
                        rounded-full
                        bg-[#78a94f]
                        shadow-[0_2px_8px_rgba(95,145,60,0.35)]
                        transition-all
                        duration-300
                        ease-out
                        ${
                          isActive
                            ? `
                              translate-y-0
                              scale-x-100
                              opacity-100
                            `
                            : `
                              -translate-y-1
                              scale-x-0
                              opacity-0
                            `
                        }
                      `}
                    />

                    <Icon
                      className={`
                        h-[1.3rem]
                        w-[1.3rem]
                        transition-all
                        duration-300
                        ease-out
                        ${
                          isActive
                            ? "scale-110"
                            : "scale-100"
                        }
                      `}
                      strokeWidth={
                        isActive
                          ? 2.35
                          : 1.9
                      }
                    />

                    {/* Cart badge */}
                    {item.label === "Keranjang" &&
cartCount > 0 ? (
  <span
    key={cartCount}
    className={`
      absolute
      -right-2
      -top-2
      flex
      h-4.5
      min-w-4.5
      items-center
      justify-center
      rounded-full
      bg-[#e24b4a]
      px-1
      text-[9px]
      font-bold
      leading-none
      text-white
      ring-2
      ring-white
      shadow-md
      animate-cart-badge-pop
    `}
  >
    {formattedCartCount}
  </span>
) : null}
                  </span>

                  <span
                    className={`
                      mt-1
                      max-w-full
                      truncate
                      text-[10px]
                      leading-none
                      transition-all
                      duration-300
                      ease-out
                      ${
                        isActive
                          ? `
                            -translate-y-0.5
                            font-bold
                            text-[#527d31]
                          `
                          : `
                            translate-y-0
                            font-semibold
                            text-slate-500
                          `
                      }
                    `}
                  >
                    {item.label}
                  </span>
                </>
              );

              const className = `
                group
                relative
                flex
                min-w-0
                flex-col
                items-center
                justify-center
                gap-0.5
                rounded-2xl
                outline-none
                transition-transform
                duration-150
                ease-out
                select-none
                active:scale-[0.92]
                active:duration-100
                focus-visible:ring-2
                focus-visible:ring-[#78a94f]/50
                focus-visible:ring-offset-2
              `;

              if (
                item.isExternal &&
                item.href !== "#"
              ) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className={className}
                  >
                    {content}
                  </a>
                );
              }

              if (
                item.isExternal &&
                item.href === "#"
              ) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    aria-label={item.label}
                    disabled
                    className={`
                      ${className}
                      cursor-not-allowed
                      opacity-45
                    `}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  className={className}
                >
                  {content}
                </Link>
              );
            }
          )}
        </div>

        {/* IOS SAFE AREA */}
        <div
          className="
            h-[env(safe-area-inset-bottom)]
          "
        />
      </nav>

      {/* CONTENT SPACER */}
      <div
        className="
          h-22
          md:hidden
        "
        aria-hidden="true"
      />
    </>
  );
}
