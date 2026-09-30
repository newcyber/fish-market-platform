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
      hideOnMobile: false,
    },
    {
      title: "Total Penjualan",
      value: formatCurrency(totalSales),
      description: "Pembayaran terverifikasi",
      icon: TrendingUp,
      iconClass:
        "bg-emerald-50 text-emerald-600",
      hideOnMobile: false,
    },
    {
      title: "Rata-rata Order",
      value: formatCurrency(averageOrder),
      description: "Nilai rata-rata per order",
      icon: WalletCards,
      iconClass:
        "bg-violet-50 text-violet-600",
      hideOnMobile: true,
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
      hideOnMobile: false,
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
      hideOnMobile: false,
    },
  ];

  return (
    <section className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.title}
            className={[
              "group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5",
              card.hideOnMobile ? "hidden sm:block" : "",
            ].join(" ")}
          >
            <div className="flex min-w-0 items-start justify-between gap-4">
              {/* ========================================== */}
              {/* CONTENT                                    */}
              {/* ========================================== */}

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium leading-4 text-[var(--pisjo-text-secondary)] sm:text-sm">
                  {card.title}
                </p>

                <p className="mt-1.5 break-words text-[18px] font-bold leading-tight tracking-tight text-[var(--pisjo-navy)] sm:mt-2 sm:text-[26px]">
                  {card.value}
                </p>
              </div>

              {/* ========================================== */}
              {/* ICON                                       */}
              {/* ========================================== */}

              <div
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 sm:h-11 sm:w-11",
                  card.iconClass,
                ].join(" ")}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>

            {/* ============================================ */}
            {/* DESCRIPTION                                  */}
            {/* ============================================ */}

            <p className="mt-2 text-[10px] leading-4 text-[var(--pisjo-text-secondary)] sm:mt-3 sm:text-xs">
              {card.description}
            </p>
          </article>
        );
      })}
    </section>
  );
}
