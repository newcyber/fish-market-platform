import Image from "next/image";
import Link from "next/link";

import {
  AlertCircle,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  ShoppingCart,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

import settingsService from "@/services/settings/settings.service";
import landingPageService from "@/repositories/landing-page/landing-page.service";
import socialStoreLinksService from "@/services/social-store-links/social-store-links.service";

/**
 * ============================================================
 * INLINE SVG ICONS
 * ============================================================
 */

function GooglePlayIcon({
  className = "h-10 w-10",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="#00A0FF"
        d="M30.4 30.8c-6.5 7.1-10.4 17.1-10.4 29.4v391.6c0 12.3 3.9 22.3 10.4 29.4L270.2 256 30.4 30.8z"
      />

      <path
        fill="#00D084"
        d="M300.5 286.3 86.1 500.7l.7.4c10.8 6 24.3 6.7 36.6-.2l270.7-152.4-93.6-62.2z"
      />

      <path
        fill="#FF3D71"
        d="M394.1 163.5 123.4 11.1C111.1 4.2 97.6 4.9 86.8 10.9l-.7.4 214.4 214.4 93.6-62.2z"
      />

      <path
        fill="#FFD600"
        d="M481.6 212.8 394.1 163.5 300.5 225.7 270.2 256l30.3 30.3 93.6 62.2 87.5-49.3c25.9-14.6 25.9-71.8 0-86.4z"
      />
    </svg>
  );
}

function AndroidIcon({
  className = "h-7 w-7",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M17.6 9.1 19 6.7a.5.5 0 0 0-.2-.7.5.5 0 0 0-.7.2l-1.4 2.4A8.4 8.4 0 0 0 12 7.3c-1.7 0-3.3.5-4.7 1.3L5.9 6.2a.5.5 0 0 0-.7-.2.5.5 0 0 0-.2.7l1.4 2.4A8.4 8.4 0 0 0 3.6 16h16.8a8.4 8.4 0 0 0-2.8-6.9ZM7.8 12.8a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6Zm8.4 0a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6ZM3.6 17h16.8v1.2c0 .7-.5 1.2-1.2 1.2h-1.4v2.1a.9.9 0 1 1-1.8 0v-2.1H9.9v2.1a.9.9 0 1 1-1.8 0v-2.1H6.7c-.7 0-1.2-.5-1.2-1.2V17H3.6Z"
      />
    </svg>
  );
}

/**
 * ============================================================
 * SHOPEE SVG
 * ============================================================
 */

function ShopeeIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M10 17.5h28l-1.8 23H11.8L10 17.5Z"
        fill="currentColor"
      />

      <path
        d="M17 18c0-5 2.8-9 7-9s7 4 7 9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M24 25c-3.3-2.2-7.2-.4-7.2 2.6 0 4.1 4.4 4.4 7.2 6.1 2.8-1.7 7.2-2 7.2-6.1 0-3-3.9-4.8-7.2-2.6Z"
        fill="white"
      />
    </svg>
  );
}

/**
 * ============================================================
 * TOKOPEDIA SVG
 * ============================================================
 */

function TokopediaIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M24 5c-10.5 0-18 7.5-18 18v5c0 7.2 5.1 13.2 12 14.7V47h12v-4.3c6.9-1.5 12-7.5 12-14.7v-5C42 12.5 34.5 5 24 5Z"
        fill="currentColor"
      />

      <path
        d="M15 21c1.7-2.2 4.3-3.5 9-3.5s7.3 1.3 9 3.5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <circle
        cx="19"
        cy="27"
        r="2.2"
        fill="white"
      />

      <circle
        cx="29"
        cy="27"
        r="2.2"
        fill="white"
      />

      <path
        d="M19 33c1.5 1.5 3.2 2.2 5 2.2s3.5-.7 5-2.2"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * ============================================================
 * TIKTOK SVG
 * ============================================================
 */

function TikTokIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M29 7h6c.4 5 3.1 8.1 8 8.7v6.1c-3.1-.2-5.7-1.1-8-2.7v12.3c0 7.4-5 11.6-11.2 11.6-6.1 0-10.8-4.1-10.8-10.2 0-6.4 5.1-10.8 12-10.3v6.2c-3.2-.3-5.7 1.2-5.7 4 0 2.4 1.8 4 4.2 4 2.7 0 5.5-1.7 5.5-6V7Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * ============================================================
 * INSTAGRAM SVG
 * ============================================================
 */

function InstagramIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="6"
        y="6"
        width="36"
        height="36"
        rx="10"
        stroke="currentColor"
        strokeWidth="3"
      />

      <circle
        cx="24"
        cy="24"
        r="8"
        stroke="currentColor"
        strokeWidth="3"
      />

      <circle
        cx="34.5"
        cy="13.5"
        r="2.2"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * ============================================================
 * SOCIAL LINK BUTTON
 * ============================================================
 */

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="
        flex
        min-w-0
        items-center
        gap-2.5
        rounded-xl
        border
        border-slate-200
        bg-white
        px-3
        py-2.5
        text-slate-700
        shadow-sm
        transition
        duration-200
        hover:-translate-y-0.5
        hover:border-slate-300
        hover:bg-slate-50
        hover:text-slate-950
      "
    >
      <span
        className="
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-slate-50
          text-slate-800
        "
      >
        {children}
      </span>

      <span className="truncate text-xs font-semibold">
        {label}
      </span>
    </a>
  );
}

/**
 * ============================================================
 * CONTACT CARD
 * ============================================================
 */

function ContactCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        flex
        min-h-[150px]
        h-full
        flex-col
        rounded-2xl
        border
        border-slate-200
        bg-slate-50
        p-4
        sm:p-5
      "
    >
      <div className="flex items-start gap-3">
        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-white
            text-slate-700
            shadow-sm
          "
        >
          {icon}
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">
            {title}
          </h3>

          <p className="mt-0.5 text-xs leading-5 text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex-1">
        {children}
      </div>
    </div>
  );
}

/**
 * ============================================================
 * DYNAMIC SITE FOOTER
 * ============================================================
 *
 * Footer global yang mengambil data dari:
 *
 * - Admin Settings
 * - Android App Settings
 * - Social & Store Links
 *
 * Digunakan oleh:
 * - Homepage
 * - Public Products
 * - Customer Area
 *
 * ============================================================
 */

export default async function DynamicSiteFooter() {
  /**
   * ==========================================================
   * LOAD SETTINGS
   * ==========================================================
   */

  const [
    settings,
    androidApp,
    socialStoreLinks,
  ] = await Promise.all([
    settingsService.getSettings(),
    landingPageService.getAndroidApp(),
    socialStoreLinksService.getLinks(),
  ]);

  /**
   * ==========================================================
   * ANDROID APP
   * ==========================================================
   */

  const androidDownloadUrl =
    androidApp?.enabled &&
    androidApp.fileUrl?.trim()
      ? androidApp.fileUrl.trim()
      : null;

  /**
   * ==========================================================
   * SOCIAL & STORE LINKS
   * ==========================================================
   */

  const googlePlayUrl =
    socialStoreLinks.googlePlayUrl?.trim() || null;

  const shopeeUrl =
    socialStoreLinks.shopeeUrl?.trim() || null;

  const tokopediaUrl =
    socialStoreLinks.tokopediaUrl?.trim() || null;

  const tiktokUrl =
    socialStoreLinks.tiktokUrl?.trim() || null;

  const instagramUrl =
    socialStoreLinks.instagramUrl?.trim() || null;

  const hasSocialLinks = Boolean(
    shopeeUrl ||
      tokopediaUrl ||
      tiktokUrl ||
      instagramUrl,
  );

  /**
   * ==========================================================
   * STORE DATA
   * ==========================================================
   */

  const storeName =
    settings.storeName?.trim() || "Pisjo Market";

  const storeDescription =
    settings.storeDescription?.trim() ||
    "Fresh Seafood";

  const footerDescription =
    settings.footerDescription?.trim() ||
    "Platform belanja dengan pengalaman belanja yang sederhana, nyaman, dan terpercaya.";

  /**
   * ==========================================================
   * STORE LOGO
   * ==========================================================
   */

  const siteLogo =
    settings.siteLogo?.trim() || null;

  /**
   * ==========================================================
   * STORE CONTACT
   * ==========================================================
   */

  const storeEmail =
    settings.email?.trim() || "";

  const storeWhatsapp =
    settings.whatsapp?.trim() || "";

  /**
   * ==========================================================
   * WHATSAPP URL
   * ==========================================================
   */

  const whatsappNumber = storeWhatsapp
    .replace(/\D/g, "")
    .replace(/^0/, "62");

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : null;

  /**
   * ==========================================================
   * STORE ADDRESS
   * ==========================================================
   */

  const storeAddress = [
    settings.address,
    settings.city,
    settings.province,
    settings.postalCode,
  ]
    .filter(
      (value): value is string =>
        Boolean(value?.trim()),
    )
    .join(", ");

  /**
   * ==========================================================
   * OPERATING HOURS
   * ==========================================================
   */

  const openingTime =
    settings.openingTime?.trim() || "";

  const closingTime =
    settings.closingTime?.trim() || "";

  const hasOperatingHours =
    Boolean(openingTime) &&
    Boolean(closingTime);

  const operatingHours = hasOperatingHours
    ? `${openingTime} - ${closingTime}`
    : "Jam operasional belum tersedia";

  /**
   * ==========================================================
   * STORE INITIAL
   * ==========================================================
   */

  const storeInitial =
    storeName
      .split(/\s+/)
      .filter(Boolean)
      .map((word: string) =>
        word.charAt(0),
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() || "PM";

  /**
   * ==========================================================
   * RETURN
   * ==========================================================
   */

  return (
    <footer className="hidden sm:block mt-12 border-t border-slate-200 bg-white sm:mt-16">
      <div
        className="
          mx-auto
          max-w-7xl
          px-4
          py-10
          sm:px-6
          sm:py-12
          lg:px-8
          lg:py-14
        "
      >
        {/* ================================================== */}
        {/* MAIN FOOTER GRID */}
        {/* ================================================== */}

        <div
          className="
            grid
            gap-8
            lg:grid-cols-12
            lg:gap-8
          "
        >
          {/* ================================================= */}
          {/* COLUMN 1 — BRAND / APP / SOCIAL */}
          {/* ================================================= */}

          <div className="lg:col-span-3">
            {/* BRAND */}

            <Link
              href="/"
              className="inline-flex items-center gap-3"
            >
              <div
                className="
                  relative
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-xl
                  bg-slate-900
                  text-sm
                  font-bold
                  text-white
                  shadow-sm
                "
              >
                {siteLogo ? (
                  <Image
                    src={siteLogo}
                    alt={`${storeName} Logo`}
                    fill
                    sizes="44px"
                    className="object-contain p-1"
                    unoptimized
                  />
                ) : (
                  <span>
                    {storeInitial}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="truncate text-base font-bold text-slate-900">
                  {storeName}
                </div>

                <div className="mt-0.5 truncate text-xs text-slate-400">
                  {storeDescription}
                </div>
              </div>
            </Link>

            {/* DESCRIPTION */}

            <p
              className="
                mt-4
                max-w-sm
                text-sm
                leading-6
                text-slate-500
              "
            >
              {footerDescription}
            </p>

            {/* APP DOWNLOAD */}

            {(googlePlayUrl ||
              androidDownloadUrl) ? (
              <div className="mt-6 space-y-3">
                {/* GOOGLE PLAY */}

                {googlePlayUrl ? (
                  <a
                    href={googlePlayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Pisjo Market di Google Play"
                    className="
                      flex
                      w-full
                      max-w-[270px]
                      items-center
                      gap-3
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      px-3.5
                      py-3
                      transition
                      hover:border-slate-300
                      hover:bg-slate-100
                    "
                  >
                    <GooglePlayIcon />

                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-500">
                        Download aplikasi kami
                      </p>

                      <p className="truncate text-sm font-semibold text-slate-900">
                        Dapatkan di Google Play
                      </p>
                    </div>
                  </a>
                ) : null}

                {/* DIRECT APK */}

                {androidDownloadUrl ? (
                  <a
                    href={androidDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Download aplikasi Android langsung"
                    className="
                      flex
                      w-full
                      max-w-[270px]
                      items-center
                      gap-3
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      px-3.5
                      py-3
                      transition
                      hover:border-slate-300
                      hover:bg-slate-100
                    "
                  >
                    <span
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-white
                        text-slate-700
                        shadow-sm
                      "
                    >
                      <AndroidIcon />
                    </span>

                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-500">
                        Download aplikasi kami
                      </p>

                      <p className="truncate text-sm font-semibold text-slate-900">
                        Download APK Android
                      </p>
                    </div>
                  </a>
                ) : null}
              </div>
            ) : null}

            {/* SOCIAL / MARKETPLACE */}

            {hasSocialLinks ? (
              <div className="mt-7">
                <h3 className="text-sm font-semibold text-slate-900">
                  Ikuti & Belanja di Pisjo Market
                </h3>

                <p
                  className="
                    mt-1
                    max-w-sm
                    text-xs
                    leading-5
                    text-slate-500
                  "
                >
                  Temukan Pisjo Market di marketplace
                  dan media sosial resmi kami.
                </p>

                <div
                  className="
                    mt-4
                    grid
                    grid-cols-2
                    gap-2
                  "
                >
                  {shopeeUrl ? (
                    <SocialLink
                      href={shopeeUrl}
                      label="Shopee"
                    >
                      <ShopeeIcon />
                    </SocialLink>
                  ) : null}

                  {tokopediaUrl ? (
                    <SocialLink
                      href={tokopediaUrl}
                      label="Tokopedia"
                    >
                      <TokopediaIcon />
                    </SocialLink>
                  ) : null}

                  {tiktokUrl ? (
                    <SocialLink
                      href={tiktokUrl}
                      label="TikTok"
                    >
                      <TikTokIcon />
                    </SocialLink>
                  ) : null}

                  {instagramUrl ? (
                    <SocialLink
                      href={instagramUrl}
                      label="Instagram"
                    >
                      <InstagramIcon />
                    </SocialLink>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {/* ================================================= */}
          {/* COLUMN 2 — STORE INFORMATION */}
          {/* ================================================= */}

          <div className="lg:col-span-6">
            <div
              className="
                grid
                gap-4
                sm:grid-cols-2
              "
            >
              {/* EMAIL */}

              <ContactCard
                icon={
                  <Mail className="h-5 w-5" />
                }
                title="Email"
                description="Hubungi kami melalui email"
              >
                {storeEmail ? (
                  <a
                    href={`mailto:${storeEmail}`}
                    className="
                      block
                      break-all
                      text-sm
                      font-medium
                      leading-6
                      text-slate-700
                      transition
                      hover:text-slate-950
                    "
                  >
                    {storeEmail}
                  </a>
                ) : (
                  <p className="text-sm leading-6 text-slate-500">
                    Email belum tersedia.
                  </p>
                )}
              </ContactCard>

              {/* WHATSAPP */}

              <ContactCard
                icon={
                  <MessageCircle className="h-5 w-5" />
                }
                title="WhatsApp"
                description="Chat langsung dengan toko"
              >
                {storeWhatsapp &&
                whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      block
                      break-all
                      text-sm
                      font-medium
                      leading-6
                      text-slate-700
                      transition
                      hover:text-slate-950
                    "
                  >
                    {storeWhatsapp}
                  </a>
                ) : (
                  <p className="text-sm leading-6 text-slate-500">
                    WhatsApp belum tersedia.
                  </p>
                )}
              </ContactCard>

              {/* LOCATION */}

              <ContactCard
                icon={
                  <MapPin className="h-5 w-5" />
                }
                title="Lokasi Toko"
                description="Alamat toko kami"
              >
                <p
                  className="
                    break-words
                    text-sm
                    leading-6
                    text-slate-600
                  "
                >
                  {storeAddress ||
                    "Alamat toko belum tersedia."}
                </p>
              </ContactCard>

              {/* OPERATING HOURS */}

              <ContactCard
                icon={
                  <Clock3 className="h-5 w-5" />
                }
                title="Jam Operasional"
                description="Waktu pelayanan toko"
              >
                <p
                  className="
                    text-[11px]
                    font-medium
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Setiap Hari
                </p>

                <p
                  className={[
                    "mt-1 text-sm font-semibold leading-6",
                    hasOperatingHours
                      ? "text-slate-800"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  {operatingHours}
                </p>
              </ContactCard>
            </div>
          </div>

          {/* ================================================= */}
          {/* COLUMN 3 — NAVIGATION */}
          {/* ================================================= */}

          <div className="lg:col-span-3">
            <div
              className="
                grid
                grid-cols-2
                gap-x-6
                gap-y-8
              "
            >
              {/* BELANJA */}

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Belanja
                </h3>

                <ul className="mt-4 space-y-3">
                  <li>
                    <Link
                      href="/products"
                      className="
                        flex
                        items-center
                        gap-2.5
                        text-sm
                        text-slate-500
                        transition
                        hover:text-slate-900
                      "
                    >
                      <Package className="h-4 w-4 shrink-0" />

                      <span>
                        Produk
                      </span>
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/customer/cart"
                      className="
                        flex
                        items-center
                        gap-2.5
                        text-sm
                        text-slate-500
                        transition
                        hover:text-slate-900
                      "
                    >
                      <ShoppingCart className="h-4 w-4 shrink-0" />

                      <span>
                        Keranjang
                      </span>
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/help"
                      className="
                        flex
                        items-center
                        gap-2.5
                        text-sm
                        text-slate-500
                        transition
                        hover:text-slate-900
                      "
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" />

                      <span>
                        Bantuan
                      </span>
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/kebijakan-pengembalian"
                      className="
                        flex
                        items-center
                        gap-2.5
                        text-sm
                        text-slate-500
                        transition
                        hover:text-slate-900
                      "
                    >
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span>Kebijakan Pengembalian</span>
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/tentang-kami"
                      className="
                        flex
                        items-center
                        gap-2.5
                        text-sm
                        text-slate-500
                        transition
                        hover:text-slate-900
                      "
                    >
                      <MessageCircle className="h-4 w-4 shrink-0" />

                      <span>
                        Tentang Kami
                      </span>
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/kontak-kami"
                      className="
                        flex
                        items-center
                        gap-2.5
                        text-sm
                        text-slate-500
                        transition
                        hover:text-slate-900
                      "
                    >
                      <MessageCircle className="h-4 w-4 shrink-0" />

                      <span>
                        Kontak Kami
                      </span>
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/changelog"
                      className="
                        flex
                        items-center
                        gap-2.5
                        text-sm
                        text-slate-500
                        transition
                        hover:text-slate-900
                      "
                    >
                      <Sparkles className="h-4 w-4 shrink-0" />

                      <span>
                        Changelog
                      </span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* AKUN */}

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Akun
                </h3>

                <ul className="mt-4 space-y-3">
                  <li>
                    <Link
                      href="/customer/account"
                      className="
                        flex
                        items-center
                        gap-2.5
                        text-sm
                        text-slate-500
                        transition
                        hover:text-slate-900
                      "
                    >
                      <User className="h-4 w-4 shrink-0" />

                      <span>
                        Profil
                      </span>
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/customer/addresses"
                      className="
                        flex
                        items-center
                        gap-2.5
                        text-sm
                        text-slate-500
                        transition
                        hover:text-slate-900
                      "
                    >
                      <MapPin className="h-4 w-4 shrink-0" />

                      <span>
                        Alamat
                      </span>
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/customer/orders"
                      className="
                        flex
                        items-center
                        gap-2.5
                        text-sm
                        text-slate-500
                        transition
                        hover:text-slate-900
                      "
                    >
                      <Package className="h-4 w-4 shrink-0" />

                      <span>
                        Pesanan Saya
                      </span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* COPYRIGHT */}
        {/* ================================================== */}

        <div
          className="
            mt-10
            border-t
            border-slate-200
            pt-6
            sm:mt-12
          "
        >
          <p
            className="
              text-center
              text-xs
              leading-6
              text-slate-400
            "
          >
            © {new Date().getFullYear()}{" "}
            {storeName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}