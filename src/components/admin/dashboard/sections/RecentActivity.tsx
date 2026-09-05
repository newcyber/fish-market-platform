"use client";

import {
  CreditCard,
  Gift,
  Package,
  ShoppingCart,
} from "lucide-react";

interface RecentActivityItem {
  id: string;
  type: "ORDER" | "PAYMENT" | "REWARD" | "STOCK";
  title: string;
  description: string;
  createdAt: string | Date;
}

interface RecentActivityProps {
  data: RecentActivityItem[];
}

function getActivityIcon(type: RecentActivityItem["type"]) {
  switch (type) {
    case "ORDER":
      return ShoppingCart;

    case "PAYMENT":
      return CreditCard;

    case "REWARD":
      return Gift;

    case "STOCK":
      return Package;

    default:
      return Package;
  }
}

function getActivityIconClass(
  type: RecentActivityItem["type"]
) {
  switch (type) {
    case "ORDER":
      return "bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]";

    case "PAYMENT":
      return "bg-emerald-50 text-emerald-600";

    case "REWARD":
      return "bg-amber-50 text-amber-600";

    case "STOCK":
      return "bg-violet-50 text-violet-600";

    default:
      return "bg-muted text-muted-foreground";
  }
}

function formatRelativeTime(
  value: string | Date
) {
  const date = new Date(value);
  const now = new Date();

  const difference =
    now.getTime() - date.getTime();

  const seconds = Math.max(
    0,
    Math.floor(difference / 1000)
  );

  if (seconds < 60) {
    return "Baru saja";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} menit lalu`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} jam lalu`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} hari lalu`;
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

export function RecentActivity({
  data,
}: RecentActivityProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
          <Package className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">
            Aktivitas Terbaru
          </h2>

          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Aktivitas terbaru dari transaksi dan operasional.
          </p>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="mt-6 divide-y">
          {data.map((activity) => {
            const Icon =
              getActivityIcon(activity.type);

            return (
              <div
                key={activity.id}
                className="flex min-w-0 gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    getActivityIconClass(
                      activity.type
                    ),
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <p className="min-w-0 text-sm font-semibold text-foreground">
                      {activity.title}
                    </p>

                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeTime(
                        activity.createdAt
                      )}
                    </span>
                  </div>

                  <p className="mt-1 break-words text-xs leading-5 text-muted-foreground sm:text-sm">
                    {activity.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 flex min-h-40 items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 text-center">
          <div>
            <Package className="mx-auto h-8 w-8 text-muted-foreground" />

            <p className="mt-3 text-sm font-medium text-foreground">
              Belum ada aktivitas.
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Aktivitas transaksi akan muncul di sini.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default RecentActivity;
