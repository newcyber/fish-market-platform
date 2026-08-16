import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ClipboardList,
  Package,
  ShoppingBag,
} from "lucide-react";

import { auth } from "@/auth";

import OrderService from "@/services/order/order.service";

/**
 * ============================================================
 * FORMAT RUPIAH
 * ============================================================
 */

function formatRupiah(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

/**
 * ============================================================
 * FORMAT DATE
 * ============================================================
 */

function formatDate(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    new Date(date)
  );
}

/**
 * ============================================================
 * STATUS LABEL
 * ============================================================
 */

function getStatusLabel(
  status: string
) {
  const labels: Record<
    string,
    string
  > = {
    PENDING:
      "Menunggu Diproses",

    WAITING_PAYMENT:
      "Menunggu Pembayaran",

    WAITING_VERIFICATION:
      "Menunggu Verifikasi",

    PROCESSING:
      "Sedang Diproses",

    SHIPPING:
      "Dalam Pengiriman",

    COMPLETED:
      "Selesai",

    CANCELLED:
      "Dibatalkan",
  };

  return (
    labels[status] ??
    status
  );
}

/**
 * ============================================================
 * CUSTOMER ORDERS PAGE
 * ============================================================
 */

export default async function CustomerOrdersPage() {
  /**
   * ==========================================================
   * AUTHENTICATION
   * ==========================================================
   */

  const session =
    await auth();

  if (
    !session?.user?.id
  ) {
    redirect(
      "/login"
    );
  }

  /**
 * ==========================================================
 * GET CUSTOMER ORDERS
 * ==========================================================
 */

const orders =
  await OrderService.getOrdersByUserId(
    session.user.id
  );

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-600 text-white">
              <ClipboardList className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Pesanan Saya
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Lihat riwayat dan status pesanan Anda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* CONTENT */}
      {/* ==================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ================================================== */}
        {/* EMPTY STATE */}
        {/* ================================================== */}

        {orders.length === 0 && (
          <div className="flex min-h-100 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-8 w-8 text-slate-400" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-950">
              Belum ada pesanan
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Anda belum memiliki riwayat pesanan.
              Mulai belanja untuk membuat pesanan pertama Anda.
            </p>

            <Link
              href="/customer/products"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              <Package className="h-4 w-4" />

              Mulai Belanja
            </Link>
          </div>
        )}

        {/* ================================================== */}
        {/* ORDER LIST */}
        {/* ================================================== */}

        {orders.length > 0 && (
          <div className="space-y-4">
            {orders.map(
              (order) => (
                <Link
                  key={order.id}
                  href={`/customer/orders/${order.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-300 hover:shadow-md"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                    {/* ================================ */}
                    {/* ORDER INFORMATION */}
                    {/* ================================ */}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">

                        <h2 className="font-semibold text-slate-950">
                          {order.orderNumber}
                        </h2>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {getStatusLabel(
                            order.status
                          )}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        {formatDate(
                          order.createdAt
                        )}
                      </p>

                      <p className="mt-3 text-sm text-slate-600">
                        {order.items.length} produk
                      </p>
                    </div>

                    {/* ================================ */}
                    {/* ORDER TOTAL */}
                    {/* ================================ */}

                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-sm text-slate-500">
                        Total Pesanan
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-950">
                        {formatRupiah(
                          Number(
                            order.total
                          )
                        )}
                      </p>

                      <span className="mt-3 inline-block text-sm font-medium text-cyan-600">
                        Lihat Detail →
                      </span>
                    </div>

                  </div>
                </Link>
              )
            )}
          </div>
        )}

      </section>
    </main>
  );
}