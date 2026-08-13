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
    user?.name?.split(" ")[0] ?? "Administrator";

  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <section className="flex flex-col gap-6 rounded-2xl border bg-background p-6 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {APP_CONFIG.branding.adminTitle}
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            {title}
          </h1>

          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="rounded-xl border bg-muted/40 px-5 py-4 text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Hari Ini
          </p>

          <p className="mt-1 text-sm font-semibold">
            {today}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-primary px-6 py-5 text-primary-foreground">
        <p className="text-sm opacity-90">
          Selamat datang kembali,
        </p>

        <h2 className="mt-1 text-2xl font-bold">
          {greeting} 👋
        </h2>

        <p className="mt-2 text-sm opacity-90">
          Semoga aktivitas {APP_CONFIG.branding.logoText} hari ini
          berjalan lancar. Pantau transaksi, produk, pelanggan,
          dan pembayaran dari satu dashboard terintegrasi.
        </p>
      </div>
    </section>
  );
}

export default DashboardHeader;