import Link from "next/link";

import type { RecentOrderDTO } from "@/types/dashboard/recent-order.dto";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RecentOrdersProps {
  data: RecentOrderDTO[];
}

function getStatusVariant(
  status: RecentOrderDTO["status"]
): "default" | "secondary" | "destructive" {
  switch (status) {
    case "COMPLETED":
      return "default";

    case "PROCESSING":
    case "SHIPPING":
    case "WAITING_VERIFICATION":
      return "secondary";

    case "PENDING":
    case "WAITING_PAYMENT":
    case "CANCELLED":
    default:
      return "destructive";
  }
}

function getStatusLabel(status: RecentOrderDTO["status"]): string {
  switch (status) {
    case "PENDING":
      return "Pending";

    case "WAITING_PAYMENT":
      return "Menunggu Pembayaran";

    case "WAITING_VERIFICATION":
      return "Menunggu Verifikasi";

    case "PROCESSING":
      return "Diproses";

    case "SHIPPING":
      return "Dikirim";

    case "COMPLETED":
      return "Selesai";

    case "CANCELLED":
      return "Dibatalkan";

    default:
      return status;
  }
}

export function RecentOrders({ data }: RecentOrdersProps) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="text-base sm:text-lg">
            Pesanan Terbaru
          </CardTitle>

          <CardDescription className="mt-1">
            Transaksi terbaru pelanggan.
          </CardDescription>
        </div>

        <Link
          href="/admin/orders"
          className="shrink-0 self-start text-sm font-medium text-primary transition-colors hover:underline sm:self-auto"
        >
          Lihat Semua
        </Link>
      </CardHeader>

      <CardContent className="px-0 sm:px-6">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[760px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[240px] whitespace-nowrap px-3">
                  No. Order
                </TableHead>

                <TableHead className="w-[210px] whitespace-nowrap px-3">
                  Pelanggan
                </TableHead>

                <TableHead className="w-[140px] whitespace-nowrap px-3 text-right">
                  Total
                </TableHead>

                <TableHead className="w-[170px] whitespace-nowrap px-3">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 px-3 text-center text-muted-foreground"
                  >
                    Belum ada transaksi.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="w-[240px] px-3">
                      <span
                        className="block truncate font-medium text-foreground"
                        title={order.orderNumber}
                      >
                        {order.orderNumber}
                      </span>
                    </TableCell>

                    <TableCell className="w-[210px] px-3">
                      <span
                        className="block truncate text-foreground"
                        title={order.customer}
                      >
                        {order.customer}
                      </span>
                    </TableCell>

                    <TableCell className="w-[140px] whitespace-nowrap px-3 text-right font-medium text-foreground">
                      Rp{" "}
                      {order.total.toLocaleString("id-ID")}
                    </TableCell>

                    <TableCell className="w-[170px] whitespace-nowrap px-3">
                      <Badge
                        variant={getStatusVariant(order.status)}
                        className="whitespace-nowrap"
                      >
                        {getStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default RecentOrders;
