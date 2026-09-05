import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CreditCard,
  PackageCheck,
  PackageSearch,
  Truck,
  XCircle,
} from "lucide-react";

import ReportService from "@/services/report/report.service";

/**
 * ============================================================
 * ADMIN REPORTS PAGE
 * ============================================================
 *
 * Menampilkan laporan transaksi menggunakan data nyata
 * dari database.
 *
 * ============================================================
 */

function formatCurrency(
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

function formatDate(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(new Date(date));
}

function getOrderStatusLabel(
  status: string
) {
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

function getOrderStatusClassName(
  status: string
) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";

    case "WAITING_PAYMENT":
      return "bg-orange-100 text-orange-700";

    case "WAITING_VERIFICATION":
      return "bg-blue-100 text-blue-700";

    case "PROCESSING":
      return "bg-purple-100 text-purple-700";

    case "SHIPPING":
      return "bg-cyan-100 text-cyan-700";

    case "COMPLETED":
      return "bg-green-100 text-green-700";

    case "CANCELLED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-muted text-muted-foreground";
  }
}

/**
 * ============================================================
 * REPORT PAGE
 * ============================================================
 */

export default async function AdminReportsPage() {
  const report =
    await ReportService.getReport();

  const {
    summary,
    recentOrders,
  } = report;

  return (
    <div className="space-y-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition hover:bg-muted"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Laporan
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Ringkasan transaksi dan aktivitas pesanan.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/admin/orders"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Lihat Semua Pesanan
        </Link>
      </div>

      {/* ======================================================
          MAIN SUMMARY
      ====================================================== */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* TOTAL ORDER */}

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Pesanan
              </p>

              <p className="mt-2 text-3xl font-bold">
                {summary.totalOrders}
              </p>
            </div>

            <div className="rounded-lg border p-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* TOTAL REVENUE */}

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Pendapatan
              </p>

              <p className="mt-2 text-2xl font-bold">
                {formatCurrency(
                  summary.totalRevenue
                )}
              </p>
            </div>

            <div className="rounded-lg border p-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Berdasarkan pesanan dengan pembayaran terverifikasi.
          </p>
        </div>

        {/* WAITING VERIFICATION */}

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Menunggu Verifikasi
              </p>

              <p className="mt-2 text-3xl font-bold">
                {
                  summary.waitingVerificationOrders
                }
              </p>
            </div>

            <div className="rounded-lg border p-2">
              <Clock3 className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Pembayaran membutuhkan pemeriksaan admin.
          </p>
        </div>

        {/* COMPLETED */}

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Pesanan Selesai
              </p>

              <p className="mt-2 text-3xl font-bold">
                {summary.completedOrders}
              </p>
            </div>

            <div className="rounded-lg border p-2">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Pesanan yang telah selesai.
          </p>
        </div>
      </div>

      {/* ======================================================
          ORDER STATUS SUMMARY
      ====================================================== */}

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Ringkasan Status Pesanan
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Jumlah pesanan berdasarkan status saat ini.
          </p>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* PENDING */}

          <div className="rounded-lg border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">
                Pending
              </span>

              <PackageSearch className="h-4 w-4 text-muted-foreground" />
            </div>

            <p className="mt-3 text-2xl font-bold">
              {summary.pendingOrders}
            </p>
          </div>

          {/* WAITING PAYMENT */}

          <div className="rounded-lg border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">
                Menunggu Pembayaran
              </span>

              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>

            <p className="mt-3 text-2xl font-bold">
              {
                summary.waitingPaymentOrders
              }
            </p>
          </div>

          {/* WAITING VERIFICATION */}

          <div className="rounded-lg border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">
                Menunggu Verifikasi
              </span>

              <Clock3 className="h-4 w-4 text-muted-foreground" />
            </div>

            <p className="mt-3 text-2xl font-bold">
              {
                summary.waitingVerificationOrders
              }
            </p>
          </div>

          {/* PROCESSING */}

          <div className="rounded-lg border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">
                Diproses
              </span>

              <PackageCheck className="h-4 w-4 text-muted-foreground" />
            </div>

            <p className="mt-3 text-2xl font-bold">
              {summary.processingOrders}
            </p>
          </div>

          {/* SHIPPING */}

          <div className="rounded-lg border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">
                Dikirim
              </span>

              <Truck className="h-4 w-4 text-muted-foreground" />
            </div>

            <p className="mt-3 text-2xl font-bold">
              {summary.shippingOrders}
            </p>
          </div>

          {/* COMPLETED */}

          <div className="rounded-lg border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">
                Selesai
              </span>

              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </div>

            <p className="mt-3 text-2xl font-bold">
              {summary.completedOrders}
            </p>
          </div>

          {/* CANCELLED */}

          <div className="rounded-lg border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">
                Dibatalkan
              </span>

              <XCircle className="h-4 w-4 text-muted-foreground" />
            </div>

            <p className="mt-3 text-2xl font-bold">
              {summary.cancelledOrders}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          RECENT ORDERS
      ====================================================== */}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Pesanan Terbaru
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              10 transaksi terbaru dalam sistem.
            </p>
          </div>

          <Link
            href="/admin/orders"
            className="text-sm font-medium text-primary hover:underline"
          >
            Lihat Semua
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />

            <h3 className="mt-4 text-base font-semibold">
              Belum ada pesanan
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Data pesanan akan muncul di halaman laporan setelah customer melakukan checkout.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">
                    Nomor Order
                  </th>

                  <th className="px-5 py-3 text-left font-medium">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-right font-medium">
                    Total
                  </th>

                  <th className="px-5 py-3 text-center font-medium">
                    Status Order
                  </th>

                  <th className="px-5 py-3 text-center font-medium">
                    Pembayaran
                  </th>

                  <th className="px-5 py-3 text-right font-medium">
                    Tanggal
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map(
                  (order) => (
                    <tr
                      key={order.id}
                      className="border-b last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium">
                          {
                            order.customerName
                          }
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          {
                            order.customerEmail
                          }
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right font-medium">
                        {formatCurrency(
                          order.total
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getOrderStatusClassName(
                            order.status
                          )}`}
                        >
                          {getOrderStatusLabel(
                            order.status
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="text-xs text-muted-foreground">
                          {
                            order.paymentStatus
                          }
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right text-xs text-muted-foreground">
                        {formatDate(
                          order.createdAt
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
