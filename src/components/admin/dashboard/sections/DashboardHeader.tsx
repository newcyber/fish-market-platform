import { auth } from "@/auth";
import { APP_CONFIG } from "@/config/app";

interface DashboardHeaderProps {
  title?: string;
  description?: string;
}

export async function DashboardHeader({
  title = "Dashboard",
  description = "Ringkasan aktivitas dan performa platform hari ini.",
}: DashboardHeaderProps) {
  const session = await auth();

  const user = session?.user;

  const greeting =
    user?.name?.split(" ")[0] ??
    "Administrator";

  const today = new Intl.DateTimeFormat(
    "id-ID",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(new Date());

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-background p-4 shadow-sm sm:gap-6 sm:p-6">
      {/* ======================================================
       * HEADER INFORMATION
       * ======================================================
       */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">
            {APP_CONFIG.branding.adminTitle}
          </p>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        {/* ==================================================
         * TODAY
         * ==================================================
         */}

        <div className="w-full rounded-xl border bg-muted/40 px-4 py-3 text-left sm:w-auto sm:px-5 sm:py-4 sm:text-right">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Hari Ini
          </p>

          <p className="mt-1 text-sm font-semibold leading-5">
            {today}
          </p>
        </div>
      </div>

      {/* ======================================================
       * WELCOME
       * ======================================================
       */}

      <div className="rounded-xl bg-primary px-4 py-4 text-primary-foreground sm:px-6 sm:py-5">
        <p className="text-sm opacity-90">
          Selamat datang kembali,
        </p>

        <h2 className="mt-1 text-xl font-bold sm:text-2xl">
          {greeting} 👋
        </h2>

        <p className="mt-2 text-sm leading-6 opacity-90">
          Semoga aktivitas{" "}
          {APP_CONFIG.branding.logoText}{" "}
          hari ini berjalan lancar. Pantau
          transaksi, produk, pelanggan, dan
          pembayaran dari satu dashboard
          terintegrasi.
        </p>
      </div>
    </section>
  );
}

export default DashboardHeader;
