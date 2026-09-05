"use client";

import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";

interface SalesChartItem {
  date: string;
  label: string;
  sales: number;
}

interface SalesChartProps {
  data: SalesChartItem[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  }

  if (value >= 1_000) {
    return `Rp ${Math.round(value / 1_000)} rb`;
  }

  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function SalesChart({ data }: SalesChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    const width = 720;
    const height = 280;
    const paddingLeft = 58;
    const paddingRight = 20;
    const paddingTop = 24;
    const paddingBottom = 42;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const values = data.map((item) => Math.max(0, item.sales));
    const maxValue = Math.max(...values, 0);

    const ceiling =
      maxValue <= 0
        ? 1
        : Math.ceil(maxValue / 4) * 4;

    const points = data.map((item, index) => {
      const x =
        data.length <= 1
          ? paddingLeft + chartWidth / 2
          : paddingLeft +
            (index / (data.length - 1)) * chartWidth;

      const ratio =
        ceiling > 0
          ? Math.max(0, item.sales) / ceiling
          : 0;

      const y =
        paddingTop +
        chartHeight -
        ratio * chartHeight;

      return {
        x,
        y,
        sales: Math.max(0, item.sales),
      };
    });

    const linePath =
      points.length > 0
        ? points
            .map(
              (point, index) =>
                `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
            )
            .join(" ")
        : "";

    const areaPath =
      points.length > 0
        ? `${linePath} L ${points[points.length - 1].x} ${
            paddingTop + chartHeight
          } L ${points[0].x} ${
            paddingTop + chartHeight
          } Z`
        : "";

    const gridLines = Array.from({ length: 5 }, (_, index) => {
      const value = (ceiling / 4) * index;
      const y =
        paddingTop +
        chartHeight -
        (index / 4) * chartHeight;

      return {
        value,
        y,
      };
    });

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      chartHeight,
      points,
      linePath,
      areaPath,
      gridLines,
    };
  }, [data]);

  const activePoint =
    activeIndex !== null
      ? chart.points[activeIndex]
      : null;

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
              <TrendingUp className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-foreground sm:text-lg">
  Penjualan Terealisasi · 7 Hari
</h2>

<p className="text-xs text-muted-foreground sm:text-sm">
  Berdasarkan pembayaran yang sudah diverifikasi
</p>
            </div>
          </div>
        </div>

        {activePoint ? (
          <div className="rounded-xl border bg-[var(--pisjo-soft-blue)] px-3 py-2 sm:text-right">
            <p className="text-[11px] text-muted-foreground">
              {data[activeIndex!]?.label}
            </p>
            <p className="text-sm font-bold text-[var(--pisjo-navy)]">
              {formatCurrency(activePoint.sales)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[560px]">
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="h-auto w-full"
            role="img"
            aria-label="Grafik penjualan tujuh hari terakhir"
          >
            <defs>
              <linearGradient
                id="sales-chart-area"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--pisjo-primary)"
                  stopOpacity="0.22"
                />
                <stop
                  offset="100%"
                  stopColor="var(--pisjo-primary)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {chart.gridLines.map((line) => (
              <g key={line.value}>
                <line
                  x1={chart.paddingLeft}
                  x2={chart.width - chart.paddingRight}
                  y1={line.y}
                  y2={line.y}
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  strokeDasharray="4 4"
                />

                <text
                  x={chart.paddingLeft - 10}
                  y={line.y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-[11px]"
                >
                  {formatCompactCurrency(line.value)}
                </text>
              </g>
            ))}

            {chart.areaPath ? (
              <path
                d={chart.areaPath}
                fill="url(#sales-chart-area)"
              />
            ) : null}

            {chart.linePath ? (
              <path
                d={chart.linePath}
                fill="none"
                stroke="var(--pisjo-primary)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {chart.points.map((point, index) => (
              <g key={data[index]?.date ?? index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={activeIndex === index ? 6 : 4}
                  fill="var(--pisjo-white)"
                  stroke="var(--pisjo-primary)"
                  strokeWidth="3"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() => setActiveIndex(index)}
                />

                <text
                  x={point.x}
                  y={chart.height - 14}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[11px]"
                >
                  {data[index]?.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Belum ada data penjualan.
          </p>
        </div>
      ) : null}
    </section>
  );
}

export default SalesChart;
