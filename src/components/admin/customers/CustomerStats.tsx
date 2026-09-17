import {
  ArrowUpRight,
  Users,
  UserPlus,
  UserCheck,
  Repeat2,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import type {
  CustomerStats as CustomerStatsData,
} from "@/services/customer/customer.service";

interface CustomerStatsProps {
  stats: CustomerStatsData;
}

const cards = [
  {
    key: "totalCustomers",
    label: "Total Customer",
    description: "Seluruh customer terdaftar",
    icon: Users,
  },
  {
    key: "newCustomersThisMonth",
    label: "Customer Baru",
    description: "Terdaftar bulan berjalan",
    icon: UserPlus,
  },
  {
    key: "activeCustomers30Days",
    label: "Aktif 30 Hari",
    description: "Melakukan pembelian",
    icon: UserCheck,
  },
  {
    key: "repeatCustomers",
    label: "Repeat Customer",
    description: "Minimal 2 transaksi",
    icon: Repeat2,
  },
] as const;

export default function CustomerStats({
  stats,
}: CustomerStatsProps) {
  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key];

        return (
          <Card
            key={card.key}
            className="overflow-hidden border-slate-200 shadow-sm"
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-muted-foreground">
                    {card.label}
                  </p>

                  <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--pisjo-navy)]">
                    {value.toLocaleString("id-ID")}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </div>

                <div className="shrink-0 rounded-xl bg-[var(--pisjo-soft-blue)] p-2.5 text-[var(--pisjo-ocean)]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-500">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Data aktual sistem
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
