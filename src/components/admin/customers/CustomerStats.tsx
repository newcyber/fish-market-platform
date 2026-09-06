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
    label: "Customer Baru Bulan Ini",
    description: "Terdaftar bulan berjalan",
    icon: UserPlus,
  },
  {
    key: "activeCustomers30Days",
    label: "Customer Aktif 30 Hari",
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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key];

        return (
          <Card key={card.key}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {card.label}
                  </p>

                  <p className="text-2xl font-bold tracking-tight">
                    {value.toLocaleString("id-ID")}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </div>

                <div className="rounded-lg bg-muted p-2.5">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
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
