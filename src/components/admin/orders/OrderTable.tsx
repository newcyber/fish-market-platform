import Link from "next/link";

import {
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

import AdminDataTable from "@/components/admin/common/AdminDataTable";
import { Button } from "@/components/ui/button";

interface OrderTableItem {
  id: string;
  orderNumber: string;

  user: {
    name: string;
    email: string;
  };

  total: unknown;

  status: OrderStatus;

  paymentStatus: PaymentStatus;

  createdAt: Date;
}

interface OrderTableProps {
  orders: OrderTableItem[];
}

function formatCurrency(
  value: unknown
) {
  const amount =
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (
      value as {
        toNumber: () => number;
      }
    ).toNumber === "function"
      ? (
          value as {
            toNumber: () => number;
          }
        ).toNumber()
      : Number(value);

  return `Rp ${amount.toLocaleString(
    "id-ID"
  )}`;
}

function formatDate(
  value: Date
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(value);
}

function getStatusLabel(
  status: OrderStatus
) {
  switch (status) {
    case OrderStatus.PENDING:
      return "Pending";

    case OrderStatus.WAITING_PAYMENT:
      return "Menunggu Pembayaran";

    case OrderStatus.WAITING_VERIFICATION:
      return "Menunggu Verifikasi";

    case OrderStatus.PROCESSING:
      return "Diproses";

    case OrderStatus.SHIPPING:
      return "Dikirim";

    case OrderStatus.COMPLETED:
      return "Selesai";

    case OrderStatus.CANCELLED:
      return "Dibatalkan";

    default:
      return status;
  }
}

function getPaymentStatusLabel(
  status: PaymentStatus
) {
  switch (status) {
    case PaymentStatus.PENDING:
      return "Pending";

    case PaymentStatus.VERIFIED:
      return "Terverifikasi";

    case PaymentStatus.REJECTED:
      return "Ditolak";

    default:
      return status;
  }
}

function getStatusClass(
  status: OrderStatus
) {
  switch (status) {
    case OrderStatus.COMPLETED:
      return "bg-green-100 text-green-700";

    case OrderStatus.CANCELLED:
      return "bg-red-100 text-red-700";

    case OrderStatus.SHIPPING:
      return "bg-blue-100 text-blue-700";

    case OrderStatus.PROCESSING:
      return "bg-purple-100 text-purple-700";

    case OrderStatus.WAITING_PAYMENT:
    case OrderStatus.WAITING_VERIFICATION:
      return "bg-yellow-100 text-yellow-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getPaymentClass(
  status: PaymentStatus
) {
  switch (status) {
    case PaymentStatus.VERIFIED:
      return "bg-green-100 text-green-700";

    case PaymentStatus.REJECTED:
      return "bg-red-100 text-red-700";

    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

export default function OrderTable({
  orders,
}: OrderTableProps) {
  return (
    <AdminDataTable
      headers={[
        "Order",
        "Customer",
        "Total",
        "Pembayaran",
        "Status",
        "Tanggal",
        "Aksi",
      ]}
    >
      {orders.length === 0 ? (
        <tr>
          <td
            colSpan={7}
            className="py-10 text-center text-muted-foreground"
          >
            Belum ada order.
          </td>
        </tr>
      ) : (
        orders.map((order) => (
          <tr
            key={order.id}
            className="border-b"
          >
            <td className="px-6 py-4">
              <div className="flex flex-col">
                <span className="font-medium">
                  {order.orderNumber}
                </span>

                <span className="text-xs text-muted-foreground">
                  #{order.id.slice(0, 8)}
                </span>
              </div>
            </td>

            <td className="px-6 py-4">
              <div className="flex flex-col">
                <span className="font-medium">
                  {order.user.name}
                </span>

                <span className="text-xs text-muted-foreground">
                  {order.user.email}
                </span>
              </div>
            </td>

            <td className="px-6 py-4 font-medium">
              {formatCurrency(
                order.total
              )}
            </td>

            <td className="px-6 py-4">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentClass(
                  order.paymentStatus
                )}`}
              >
                {getPaymentStatusLabel(
                  order.paymentStatus
                )}
              </span>
            </td>

            <td className="px-6 py-4">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                  order.status
                )}`}
              >
                {getStatusLabel(
                  order.status
                )}
              </span>
            </td>

            <td className="px-6 py-4 text-sm text-muted-foreground">
              {formatDate(
                order.createdAt
              )}
            </td>

            <td className="px-6 py-4">
              <div className="flex gap-2">
                <Link
                  href={`/admin/orders/${order.id}`}
                >
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                  >
                    Detail
                  </Button>
                </Link>
              </div>
            </td>
          </tr>
        ))
      )}
    </AdminDataTable>
  );
}