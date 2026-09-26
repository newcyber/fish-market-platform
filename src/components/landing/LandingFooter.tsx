import Image from "next/image";
import Link from "next/link";

type LandingFooterProps = {
  storeName: string;
  storeDescription: string;
  siteLogo?: string | null;
  storeInitial: string;
  storeUrl: string;
};

export default function LandingFooter({
  storeName,
  storeDescription,
  siteLogo,
  storeInitial,
  storeUrl,
}: LandingFooterProps) {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        {/* ================================================== */}
        {/* BRAND                                               */}
        {/* ================================================== */}

        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--pisjo-primary)] text-xs font-bold text-white">
            {siteLogo ? (
              <Image
                src={siteLogo}
                alt={`${storeName} Logo`}
                fill
                sizes="36px"
                className="object-contain p-1"
                unoptimized
              />
            ) : (
              storeInitial
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {storeName}
            </p>

            <p className="truncate text-xs text-slate-400">
              {storeDescription}
            </p>
          </div>
        </div>

        {/* ================================================== */}
        {/* NAVIGATION                                          */}
        {/* ================================================== */}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
          {/* Store */}
          <a
            href={storeUrl}
            className="transition hover:text-[var(--pisjo-primary)]"
          >
            Store
          </a>

          {/* About */}
          <Link
            href="/tentang-kami"
            className="transition hover:text-[var(--pisjo-primary)]"
          >
            Tentang Kami
          </Link>

          {/* Contact */}
          <Link
            href="/kontak-kami"
            className="transition hover:text-[var(--pisjo-primary)]"
          >
            Kontak Kami
          </Link>

          {/* Privacy */}
          <Link
            href="/privacy-policy"
            className="transition hover:text-[var(--pisjo-primary)]"
          >
            Privasi
          </Link>

          {/* Terms */}
          <Link
            href="/terms-and-conditions"
            className="transition hover:text-[var(--pisjo-primary)]"
          >
            Syarat & Ketentuan
          </Link>
        </div>
      </div>
    </footer>
  );
}
