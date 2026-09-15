import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
    <header className="relative z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label={`${storeName} Beranda`}
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--pisjo-primary)] text-sm font-bold text-white shadow-sm">
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
            <p className="truncate text-sm font-bold tracking-tight text-slate-950 sm:text-base">
              {storeName}
            </p>

            <p className="hidden truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--pisjo-primary)] sm:block">
              {storeDescription}
            </p>
          </div>
        </Link>

        <a
          href={storeUrl}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--pisjo-primary)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--pisjo-ocean)] sm:px-5"
        >
          <span className="hidden sm:inline">Belanja Sekarang</span>

          <span className="sm:hidden">Belanja</span>

          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}
