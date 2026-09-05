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
  orders: RecentOrderDTO[];
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

function getStatusLabel(
  status: RecentOrderDTO["status"]
): string {
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

export function RecentOrders({
  orders,
}: RecentOrdersProps) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="text-base sm:text-lg">
            Pesanan Terbaru
          </CardTitle>

          <CardDescription>
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
          <Table className="min-w-[620px]">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">
                  No. Order
                </TableHead>

                <TableHead className="whitespace-nowrap">
                  Pelanggan
                </TableHead>

                <TableHead className="whitespace-nowrap text-right">
                  Total
                </TableHead>

                <TableHead className="whitespace-nowrap">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Belum ada transaksi.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="whitespace-nowrap font-medium">
                      {order.orderNumber}
                    </TableCell>

                    <TableCell className="max-w-55 truncate">
                      {order.customer}
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-right font-medium">
                      Rp{" "}
                      {order.total.toLocaleString(
                        "id-ID"
                      )}
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      <Badge
                        variant={getStatusVariant(
                          order.status
                        )}
                      >
                        {getStatusLabel(
                          order.status
                        )}
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
