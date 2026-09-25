import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
} from "lucide-react";

import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import landingPageService from "@/repositories/landing-page/landing-page.service";
import settingsService from "@/services/settings/settings.service";

function normalizeWhatsappNumber(value?: string | null) {
  const number = value?.replace(/\D/g, "") || "";

  if (!number) {
    return "";
  }

  if (number.startsWith("0")) {
    return `62${number.slice(1)}`;
  }

  if (number.startsWith("62")) {
    return number;
  }

  return `62${number}`;
}

export default async function ContactUsPage() {
  const [settings, landing] = await Promise.all([
    settingsService.getSettings(),
    landingPageService.getPublicLandingPage(),
  ]);

  const storeName =
    landing.brand.storeName?.trim() ||
    settings.storeName?.trim() ||
    "Pisjo Market";

  const storeDescription =
    landing.brand.storeDescription?.trim() ||
    settings.storeDescription?.trim() ||
    "";

  const siteLogo =
    landing.brand.siteLogo?.trim() ||
    settings.siteLogo?.trim() ||
    null;

  const androidUrl =
    landing.urls.android || landing.urls.store;

  const storeUrl = landing.urls.store;

  const storeInitial =
    storeName
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "PM";

  const email =
    settings.email?.trim() || "";

  const whatsapp =
    settings.whatsapp?.trim() || "";

  const whatsappNumber =
    normalizeWhatsappNumber(whatsapp);

  const whatsappUrl =
    whatsappNumber
      ? `https://wa.me/${whatsappNumber}`
      : null;

  const addressParts = [
    settings.address,
    settings.city,
    settings.province,
    settings.postalCode,
  ].filter(
    (value): value is string =>
      Boolean(value?.trim()),
  );

  const fullAddress =
    addressParts.join(", ");

  const openingTime =
    settings.openingTime?.trim() || "";

  const closingTime =
    settings.closingTime?.trim() || "";

  const operatingHours =
    openingTime && closingTime
      ? `${openingTime} - ${closingTime}`
      : "Jam operasional belum tersedia";

const latitude =
  settings.latitude?.toString().trim() || "";

const longitude =
  settings.longitude?.toString().trim() || "";

const hasCoordinates =
  Boolean(latitude) && Boolean(longitude);

const googleMapsUrl = hasCoordinates
  ? `https://www.google.com/maps?q=${latitude},${longitude}`
  : null;

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4fbff] text-[var(--pisjo-navy)]">
      <LandingHeader
        storeName={storeName}
        storeDescription={storeDescription}
        siteLogo={siteLogo}
        storeInitial={storeInitial}
        storeUrl={storeUrl}
      />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              {storeName}
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Kontak Kami
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Kami siap membantu Anda untuk informasi produk,
              pemesanan, pengiriman, dan kebutuhan seafood segar.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* WHATSAPP */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <MessageCircle className="h-5 w-5" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-950">
              WhatsApp
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Chat langsung dengan tim {storeName}.
            </p>

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Chat WhatsApp
                <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <p className="mt-5 text-sm text-slate-400">
                Nomor WhatsApp belum tersedia.
              </p>
            )}
          </div>

          {/* EMAIL */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Mail className="h-5 w-5" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-950">
              Email
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Kirim pertanyaan atau kebutuhan Anda melalui email.
            </p>

            {email ? (
              <a
                href={`mailto:${email}`}
                className="mt-5 inline-flex break-all text-sm font-semibold text-slate-700 underline-offset-4 hover:underline"
              >
                {email}
              </a>
            ) : (
              <p className="mt-5 text-sm text-slate-400">
                Email belum tersedia.
              </p>
            )}
          </div>

          {/* JAM OPERASIONAL */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Clock3 className="h-5 w-5" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-950">
              Jam Operasional
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Kami siap melayani Anda pada:
            </p>

            <p className="mt-5 text-sm font-semibold text-slate-900">
              {operatingHours}
            </p>
          </div>
        </div>

        {/* LOKASI */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-2">
            <div className="p-6 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <MapPin className="h-5 w-5" />
              </div>

              <h2 className="mt-5 text-xl font-semibold text-slate-950">
                Lokasi Kami
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Kunjungi lokasi {storeName} atau gunakan Google Maps
                untuk mendapatkan petunjuk arah.
              </p>

              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-medium leading-6 text-slate-700">
                  {fullAddress || "Alamat toko belum tersedia."}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {googleMapsUrl ? (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Navigation className="h-4 w-4" />
                    Buka di Google Maps
                  </a>
                ) : null}
              </div>
            </div>

            <div className="min-h-[280px] bg-slate-100 lg:min-h-full">
              {googleMapsUrl ? (
                <iframe
                  title={`Lokasi ${storeName}`}
                  src={`https://www.google.com/maps?q=${latitude},${longitude}&output=embed`}
                  className="h-full min-h-[280px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="flex h-full min-h-[280px] items-center justify-center p-8 text-center">
                  <div>
                    <MapPin className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-3 text-sm text-slate-500">
                      Lokasi toko belum tersedia.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 rounded-2xl bg-slate-950 px-6 py-8 text-white sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Butuh ikan segar hari ini?
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                Temukan berbagai pilihan ikan dan seafood segar di
                {` ${storeName}`}.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Mulai Belanja
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter
        storeName={storeName}
        storeDescription={storeDescription}
        siteLogo={siteLogo}
        storeInitial={storeInitial}
        storeUrl={storeUrl}
      />
    </main>
  );
}
