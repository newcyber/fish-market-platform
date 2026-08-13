import Link from "next/link";

import { PaymentVerificationService } from "@/services/payment/payment-verification.service";

/**
 * ============================================================
 *
 * ADMIN PAYMENT VERIFICATION PAGE
 *
 * ============================================================
 */

function getStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Menunggu Verifikasi";

    case "VERIFIED":
      return "Terverifikasi";

    case "REJECTED":
      return "Ditolak";

    default:
      return status;
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";

    case "VERIFIED":
      return "bg-green-100 text-green-700";

    case "REJECTED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(new Date(date));
}

export default async function AdminPaymentsPage() {
  const result =
    await PaymentVerificationService.getAll();

  const payments =
    result.success && Array.isArray(result.data)
      ? result.data
      : [];

  return (
    <div className="space-y-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Verifikasi Pembayaran
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Kelola dan verifikasi bukti pembayaran
          yang dikirim oleh customer.
        </p>
      </div>

      {/* ======================================================
          ERROR STATE
      ====================================================== */}

      {!result.success && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {result.message ??
              "Gagal mengambil data pembayaran."}
          </p>
        </div>
      )}

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {result.success &&
        payments.length === 0 && (
          <div className="rounded-xl border bg-card p-10 text-center">
            <h2 className="text-lg font-semibold">
              Belum ada pembayaran
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Bukti pembayaran dari customer akan
              muncul di halaman ini.
            </p>
          </div>
        )}

      {/* ======================================================
          PAYMENT TABLE
      ====================================================== */}

      {payments.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">
                    Order
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Pembayaran
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Waktu Upload
                  </th>

                  <th className="px-4 py-3 text-center font-medium">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right font-medium">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b last:border-b-0 hover:bg-muted/30"
                  >
                    {/* ORDER */}

                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {payment.order.orderNumber}
                      </div>
                    </td>

                    {/* CUSTOMER */}

                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {payment.order.user.name ??
                          "Customer"}
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        {payment.order.user.email}
                      </div>
                    </td>

                    {/* PAYMENT */}

                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {payment.bankName ??
                            "Bank tidak diketahui"}
                        </p>

                        {payment.accountNumber && (
                          <p className="font-mono text-xs text-muted-foreground">
                            {payment.accountNumber}
                          </p>
                        )}

                        {payment.accountName && (
                          <p className="text-xs text-muted-foreground">
                            a.n. {payment.accountName}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* UPLOAD TIME */}

                    <td className="px-4 py-4 text-muted-foreground">
                      {formatDate(
                        payment.createdAt
                      )}
                    </td>

                    {/* STATUS */}

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                          payment.status
                        )}`}
                      >
                        {getStatusLabel(
                          payment.status
                        )}
                      </span>
                    </td>

                    {/* ACTION */}

                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/admin/payments/${payment.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition hover:bg-muted"
                      >
                        Lihat
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}