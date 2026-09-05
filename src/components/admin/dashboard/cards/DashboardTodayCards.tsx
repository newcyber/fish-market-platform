import {
  CircleDollarSign,
  ShoppingBag,
  WalletCards,
} from "lucide-react";

interface DashboardTodayCardsProps {
  orders: number;
  sales: number;
  pendingPayments: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function DashboardTodayCards({
  orders,
  sales,
  pendingPayments,
}: DashboardTodayCardsProps) {
  const cards = [
    {
      title: "Pesanan Hari Ini",
      value: orders.toLocaleString("id-ID"),
      description: "Pesanan dibuat hari ini",
      icon: ShoppingBag,
    },
{
  title: "Penjualan Hari Ini",
  value: formatCurrency(sales),
  description: "Pembayaran terverifikasi hari ini",
  icon: CircleDollarSign,
},
    {
      title: "Menunggu Pembayaran",
      value: pendingPayments.toLocaleString("id-ID"),
      description: "Bukti pembayaran perlu diproses",
      icon: WalletCards,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
<article
  key={card.title}
  className="min-w-0 overflow-hidden rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
>
  <div className="flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
      <Icon className="h-5 w-5" />
    </div>

    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-muted-foreground">
        {card.title}
      </p>

      <p className="mt-1 whitespace-nowrap text-xl font-bold leading-tight text-foreground">
        {card.value}
      </p>
    </div>
  </div>

  <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
    {card.description}
  </p>
</article>
        );
      })}
    </section>
  );
}
