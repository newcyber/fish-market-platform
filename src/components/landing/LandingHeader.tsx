import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Menu, ShoppingCart } from "lucide-react";

type LandingHeaderProps = {
  storeName: string;
  storeDescription: string;
  siteLogo?: string | null;
  storeInitial: string;
  storeUrl: string;
};

export default function LandingHeader({
  storeName,
  storeDescription,
  siteLogo,
  storeInitial,
  storeUrl,
}: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex min-h-[64px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5"
          aria-label={`${storeName} Beranda`}
        >
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--pisjo-primary)] text-xs font-black text-white shadow-sm sm:h-10 sm:w-10">
            {siteLogo ? (
              <Image
                src={siteLogo}
                alt={`${storeName} Logo`}
                fill
                sizes="40px"
                className="object-contain p-1"
                priority
                unoptimized
              />
            ) : (
              storeInitial
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-black tracking-tight text-slate-950 sm:text-base">
              {storeName}
            </p>

            <p className="hidden max-w-[220px] truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pisjo-primary)] sm:block">
              {storeDescription}
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href={storeUrl}
            aria-label="Keranjang dan belanja"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[var(--pisjo-navy)] transition hover:border-[var(--pisjo-primary)] hover:text-[var(--pisjo-primary)] sm:h-10 sm:w-10"
          >
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>

          <button
            type="button"
            aria-label="Menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[var(--pisjo-navy)] transition hover:border-[var(--pisjo-primary)] hover:text-[var(--pisjo-primary)] sm:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <Link
            href={storeUrl}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-[var(--pisjo-primary)] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[var(--pisjo-ocean)] sm:min-h-10 sm:gap-2 sm:px-5 sm:text-sm"
          >
            <span className="sm:hidden">Belanja</span>
            <span className="hidden sm:inline">Belanja Sekarang</span>
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
