"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  PackageCheck,
  Truck,
  WalletCards,
} from "lucide-react";

import type { OrderStatus } from "@prisma/client";

interface OrderStatusDonutProps {
  data: Record<OrderStatus, number>;
}

interface StatusItem {
  status: OrderStatus;
  label: string;
  value: number;
  icon: typeof Clock3;
}

const STATUS_CONFIG: StatusItem[] = [
  {
    status: "PENDING",
    label: "Pending",
    value: 0,
    icon: Clock3,
  },
  {
    status: "WAITING_PAYMENT",
    label: "Menunggu Pembayaran",
    value: 0,
    icon: WalletCards,
  },
  {
    status: "WAITING_VERIFICATION",
    label: "Menunggu Verifikasi",
    value: 0,
    icon: CircleAlert,
  },
  {
    status: "PROCESSING",
    label: "Diproses",
    value: 0,
    icon: PackageCheck,
  },
  {
    status: "SHIPPING",
    label: "Dikirim",
    value: 0,
    icon: Truck,
  },
  {
    status: "COMPLETED",
    label: "Selesai",
    value: 0,
    icon: CheckCircle2,
  },
  {
    status: "CANCELLED",
    label: "Dibatalkan",
    value: 0,
    icon: CircleAlert,
  },
];

function getStatusColor(status: OrderStatus) {
  switch (status) {
    case "COMPLETED":
      return "var(--pisjo-green)";

    case "SHIPPING":
      return "var(--pisjo-primary)";

    case "PROCESSING":
      return "var(--pisjo-cyan)";

    case "WAITING_VERIFICATION":
      return "#F59E0B";

    case "WAITING_PAYMENT":
      return "#8B5CF6";

    case "CANCELLED":
      return "var(--pisjo-red)";

    case "PENDING":
    default:
      return "#94A3B8";
  }
}

function formatNumber(value: number) {
  return value.toLocaleString("id-ID");
}

export function OrderStatusDonut({
  data,
}: OrderStatusDonutProps) {
  const [activeStatus, setActiveStatus] =
    useState<OrderStatus | null>(null);

  const items = useMemo(() => {
    return STATUS_CONFIG.map((item) => ({
      ...item,
      value: data[item.status] ?? 0,
    }));
  }, [data]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.value, 0),
    [items],
  );

  const activeItem =
    items.find((item) => item.status === activeStatus) ?? null;

  const radius = 72;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div>
        <h2 className="text-base font-semibold text-foreground sm:text-lg">
          Status Pesanan
        </h2>

        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Distribusi seluruh pesanan berdasarkan status.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
        <div className="relative mx-auto h-[200px] w-[200px]">
          <svg
            viewBox="0 0 200 200"
            className="h-full w-full -rotate-90"
            role="img"
            aria-label="Donut status pesanan"
          >
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeWidth="24"
            />

            {total > 0
              ? items.map((item) => {
                  if (item.value <= 0) {
                    return null;
                  }

                  const segmentLength =
                    (item.value / total) * circumference;

                  const dashOffset =
                    -accumulated;

                  accumulated += segmentLength;

                  return (
                    <circle
                      key={item.status}
                      cx="100"
                      cy="100"
                      r={radius}
                      fill="none"
                      stroke={getStatusColor(item.status)}
                      strokeWidth={
                        activeStatus === item.status
                          ? 28
                          : 24
                      }
                      strokeLinecap="butt"
                      strokeDasharray={`${segmentLength} ${
                        circumference - segmentLength
                      }`}
                      strokeDashoffset={dashOffset}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() =>
                        setActiveStatus(item.status)
                      }
                      onMouseLeave={() =>
                        setActiveStatus(null)
                      }
                      onClick={() =>
                        setActiveStatus(item.status)
                      }
                    />
                  );
                })
              : null}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-muted-foreground">
              {activeItem?.label ?? "Total Pesanan"}
            </p>

            <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--pisjo-navy)]">
              {formatNumber(
                activeItem?.value ?? total,
              )}
            </p>

            {activeItem && total > 0 ? (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {Math.round(
                  (activeItem.value / total) * 100,
                )}
                %
              </p>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const percentage =
              total > 0
                ? Math.round(
                    (item.value / total) * 100,
                  )
                : 0;

            return (
              <button
                key={item.status}
                type="button"
                className={[
                  "flex w-full min-w-0 items-center gap-3 rounded-xl p-2.5 text-left",
                  "transition-colors hover:bg-muted/60",
                  activeStatus === item.status
                    ? "bg-muted/70"
                    : "",
                ].join(" ")}
                onMouseEnter={() =>
                  setActiveStatus(item.status)
                }
                onMouseLeave={() =>
                  setActiveStatus(null)
                }
                onClick={() =>
                  setActiveStatus(item.status)
                }
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: getStatusColor(
                      item.status,
                    ),
                  }}
                />

                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />

                  <span className="min-w-0 truncate text-sm text-foreground">
                    {item.label}
                  </span>
                </span>

                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold text-foreground">
                    {formatNumber(item.value)}
                  </span>

                  <span className="block text-[11px] text-muted-foreground">
                    {percentage}%
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {total === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed bg-muted/20 px-4 py-3 text-center">
          <p className="text-sm text-muted-foreground">
            Belum ada data pesanan.
          </p>
        </div>
      ) : null}
    </section>
  );
}

export default OrderStatusDonut;
