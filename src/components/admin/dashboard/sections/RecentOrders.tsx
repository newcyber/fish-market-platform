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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Pesanan Terbaru</CardTitle>

          <CardDescription>
            Transaksi terbaru pelanggan.
          </CardDescription>
        </div>

        <Link
          href="/admin/orders"
          className="text-sm font-medium text-primary transition-colors hover:underline"
        >
          Lihat Semua
        </Link>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Order</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead className="text-right">
                Total
              </TableHead>
              <TableHead>Status</TableHead>
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
                  <TableCell className="font-medium">
                    {order.orderNumber}
                  </TableCell>

                  <TableCell>
                    {order.customer}
                  </TableCell>

                  <TableCell className="text-right font-medium">
                    Rp{" "}
                    {order.total.toLocaleString("id-ID")}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={getStatusVariant(order.status)}
                    >
                      {getStatusLabel(order.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default RecentOrders;