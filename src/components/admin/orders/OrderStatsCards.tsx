import {
  CheckCircle2,
  Clock3,
  ShoppingCart,
  TrendingUp,
  WalletCards,
} from "lucide-react";

interface OrderStatsCardsProps {
  totalOrders: number;
  totalSales: number;
  averageOrder: number;
  completedOrders: number;
  pendingPayments: number;
}

/**
 * ==========================================================
 * CURRENCY
 * ==========================================================
 */

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * ==========================================================
 * COMPONENT
 * ==========================================================
 */

export default function OrderStatsCards({
  totalOrders,
  totalSales,
  averageOrder,
  completedOrders,
  pendingPayments,
}: OrderStatsCardsProps) {
  const cards = [
    {
      title: "Total Order",
      value: totalOrders.toLocaleString("id-ID"),
      description: "Seluruh order aktif",
      icon: ShoppingCart,
      iconClass:
        "bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]",
    },
    {
      title: "Total Penjualan",
      value: formatCurrency(totalSales),
      description: "Pembayaran terverifikasi",
      icon: TrendingUp,
      iconClass:
        "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Rata-rata Order",
      value: formatCurrency(averageOrder),
      description: "Nilai rata-rata per order",
      icon: WalletCards,
      iconClass:
        "bg-violet-50 text-violet-600",
    },
    {
      title: "Order Selesai",
      value: completedOrders.toLocaleString(
        "id-ID"
      ),
      description: "Order berstatus selesai",
      icon: CheckCircle2,
      iconClass:
        "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Menunggu Pembayaran",
      value: pendingPayments.toLocaleString(
        "id-ID"
      ),
      description: "Perlu ditindaklanjuti",
      icon: Clock3,
      iconClass:
        "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.title}
            className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex min-w-0 items-start justify-between gap-4">
              {/* ========================================== */}
              {/* CONTENT                                    */}
              {/* ========================================== */}

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--pisjo-text-secondary)]">
                  {card.title}
                </p>

                <p className="mt-2 break-words text-2xl font-bold leading-tight tracking-tight text-[var(--pisjo-navy)] sm:text-[26px]">
                  {card.value}
                </p>
              </div>

              {/* ========================================== */}
              {/* ICON                                       */}
              {/* ========================================== */}

              <div
                className={[
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
                  card.iconClass,
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>

            {/* ============================================ */}
            {/* DESCRIPTION                                  */}
            {/* ============================================ */}

            <p className="mt-3 text-xs text-[var(--pisjo-text-secondary)]">
              {card.description}
            </p>
          </article>
        );
      })}
    </section>
  );
}
