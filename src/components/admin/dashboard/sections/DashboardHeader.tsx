import Image from "next/image";

import { auth } from "@/auth";
import settingsService from "@/services/settings/settings.service";
interface DashboardHeaderProps {
  title?: string;
  description?: string;
}

export async function DashboardHeader({
  title = "Dashboard",
  description,
}: DashboardHeaderProps) {
  const [session, settings] = await Promise.all([
    auth(),
    settingsService.getSettings(),
  ]);

  const user = session?.user;

  const greeting =
    user?.name?.split(" ")[0]?.trim() ||
    "Administrator";

  const storeName =
    settings.storeName?.trim() ||
    "Pisjo Market";

  const storeDescription =
    settings.storeDescription?.trim() ||
    "Fresh Seafood";

  const siteLogo =
    settings.siteLogo?.trim() ||
    null;

  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const dashboardDescription =
    description?.trim() ||
    `Ringkasan aktivitas dan performa ${storeName} hari ini.`;

  return (
    <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
      {/* ======================================================
       * HEADER INFORMATION
       * ======================================================
       */}
      <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-[var(--pisjo-primary)] sm:text-sm">
            {storeName}
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {dashboardDescription}
          </p>
        </div>

        {/* ==================================================
         * TODAY
         * ==================================================
         */}
        <div className="w-full shrink-0 rounded-xl border bg-[var(--pisjo-soft-blue)] px-4 py-3 text-left sm:w-auto sm:px-5 sm:py-4 sm:text-right">
          <p className="text-[11px] uppercase tracking-wide text-[var(--pisjo-text-secondary)]">
            Hari Ini
          </p>

          <p className="mt-1 text-sm font-semibold leading-5 text-[var(--pisjo-navy)]">
            {today}
          </p>
        </div>
      </div>

      {/* ======================================================
       * WELCOME BANNER
       * ======================================================
       */}
      <div className="bg-[linear-gradient(135deg,#0574C9_0%,#0788E8_55%,#18B7EA_100%)] px-4 py-5 text-white sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white/90">
              Selamat datang kembali,
            </p>

            <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
              {greeting} 👋
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">
              Kelola aktivitas {storeName} dengan lebih mudah dari satu
              dashboard terintegrasi.
            </p>

            <p className="mt-1 text-xs text-white/75">
              {storeDescription}
            </p>
          </div>

          {/* ==================================================
           * STORE LOGO
           * ==================================================
           */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/15 p-2 shadow-sm sm:h-20 sm:w-20">
            {siteLogo ? (
              <Image
                src={siteLogo}
                alt={`${storeName} logo`}
                width={80}
                height={80}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-2xl font-bold text-white sm:text-3xl">
                {storeName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default DashboardHeader;
