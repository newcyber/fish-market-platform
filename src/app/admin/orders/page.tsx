import {
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

import OrderTable from "@/components/admin/orders/OrderTable";
import OrderToolbar from "@/components/admin/orders/OrderToolbar";

import OrderService from "@/services/order/order.service";

export const dynamic =
  "force-dynamic";

interface OrdersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    paymentStatus?: string;
  }>;
}

const ORDER_STATUSES =
  Object.values(OrderStatus);

const PAYMENT_STATUSES =
  Object.values(PaymentStatus);

export default async function OrdersPage({
  searchParams,
}: OrdersPageProps) {
  const params =
    await searchParams;

  const status =
    params.status &&
    ORDER_STATUSES.includes(
      params.status as OrderStatus
    )
      ? (params.status as OrderStatus)
      : undefined;

  const paymentStatus =
    params.paymentStatus &&
    PAYMENT_STATUSES.includes(
      params.paymentStatus as PaymentStatus
    )
      ? (params.paymentStatus as PaymentStatus)
      : undefined;

  const orders =
    await OrderService.getOrders({
      search:
        params.search?.trim() ||
        undefined,

      status,

      paymentStatus,

      take: 20,

      skip: 0,

      orderBy: "createdAt",

      order: "desc",
    });

  return (
    <div className="space-y-6">
      {/* ================================================== */}
      {/* PAGE HEADER                                        */}
      {/* ================================================== */}

      <div>
        <h1 className="text-3xl font-bold">
          Order
        </h1>

        <p className="text-muted-foreground">
          Kelola seluruh order yang
          masuk ke dalam sistem.
        </p>
      </div>

      {/* ================================================== */}
      {/* ORDER TOOLBAR                                     */}
      {/* ================================================== */}

      <OrderToolbar
        key={`${params.search ?? ""}-${params.status ?? "all"}-${params.paymentStatus ?? "all"}`}
        search={params.search}
        status={
          params.status ?? "all"
        }
        paymentStatus={
          params.paymentStatus ??
          "all"
        }
      />

      {/* ================================================== */}
      {/* ORDER TABLE                                       */}
      {/* ================================================== */}

      <OrderTable
        orders={orders}
      />
    </div>
  );
}