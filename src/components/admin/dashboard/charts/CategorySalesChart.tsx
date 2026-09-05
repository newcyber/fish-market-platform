"use client";

import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";

interface CategorySalesItem {
  id: string;
  name: string;
  sales: number;
}

interface CategorySalesChartProps {
  data: CategorySalesItem[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000)
      .toFixed(1)
      .replace(".", ",")} M`;
  }

  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000)
      .toFixed(1)
      .replace(".", ",")} jt`;
  }

  if (value >= 1_000) {
    return `Rp ${Math.round(value / 1_000)} rb`;
  }

  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function CategorySalesChart({
  data,
}: CategorySalesChartProps) {
  const [activeId, setActiveId] = useState<string | null>(
    null,
  );

  const chartData = useMemo(() => {
    const sorted = [...data]
      .filter((item) => item.sales > 0)
      .sort((a, b) => b.sales - a.sales);

    const topCategories = sorted.slice(0, 6);

    const totalSales = sorted.reduce(
      (sum, item) => sum + item.sales,
      0,
    );

    const maxSales = Math.max(
      ...topCategories.map((item) => item.sales),
      0,
    );

    return {
      items: topCategories,
      totalSales,
      maxSales,
    };
  }, [data]);

  const activeItem =
    chartData.items.find(
      (item) => item.id === activeId,
    ) ?? null;

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
            <BarChart3 className="h-4 w-4" />
          </div>

          <div className="min-w-0">
<h2 className="text-base font-semibold text-foreground sm:text-lg">
  Penjualan Produk per Kategori
</h2>

<p className="mt-1 text-xs text-muted-foreground sm:text-sm">
  Nilai produk terjual berdasarkan pembayaran yang sudah diverifikasi.
</p>
          </div>
        </div>

        {activeItem ? (
          <div className="shrink-0 rounded-xl border bg-[var(--pisjo-soft-blue)] px-3 py-2 sm:text-right">
            <p className="max-w-[180px] truncate text-[11px] text-muted-foreground">
              {activeItem.name}
            </p>

            <p className="text-sm font-bold text-[var(--pisjo-navy)]">
              {formatCurrency(activeItem.sales)}
            </p>
          </div>
        ) : null}
      </div>

      {chartData.items.length > 0 ? (
        <div className="mt-6 space-y-4">
          {chartData.items.map((item) => {
            const percentage =
              chartData.maxSales > 0
                ? (item.sales / chartData.maxSales) * 100
                : 0;

            const totalPercentage =
              chartData.totalSales > 0
                ? Math.round(
                    (item.sales /
                      chartData.totalSales) *
                      100,
                  )
                : 0;

            const isActive = activeId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={[
                  "block w-full rounded-xl p-2 text-left transition-colors",
                  "hover:bg-muted/60",
                  isActive ? "bg-muted/70" : "",
                ].join(" ")}
                onMouseEnter={() =>
                  setActiveId(item.id)
                }
                onMouseLeave={() =>
                  setActiveId(null)
                }
                onClick={() =>
                  setActiveId(item.id)
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="min-w-0 truncate text-sm font-medium text-foreground"
                    title={item.name}
                  >
                    {item.name}
                  </span>

                  <span className="shrink-0 text-right text-sm font-semibold text-foreground">
                    {formatCompactCurrency(item.sales)}
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[var(--pisjo-primary)] transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>

                <div className="mt-1 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-muted-foreground">
                    {totalPercentage}% dari penjualan produk
                  </span>

                  <span className="text-[11px] text-muted-foreground">
                    {formatCurrency(item.sales)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 flex min-h-48 items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 text-center">
          <div>
            <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground" />

            <p className="mt-3 text-sm font-medium text-foreground">
              Belum ada data penjualan kategori.
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Data akan muncul setelah transaksi berhasil
              diverifikasi.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default CategorySalesChart;
