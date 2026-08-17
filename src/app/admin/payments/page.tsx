import Link from "next/link";

import { PaymentVerificationService } from "@/services/payment/payment-verification.service";

/**
 * ============================================================
 *
 * ADMIN PAYMENT VERIFICATION PAGE
 *
 * ============================================================
 */

function getStatusLabel(
  status: string
) {
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

function getStatusClass(
  status: string
) {
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

function formatDate(
  date: Date | string
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(
    new Date(date)
  );
}

/**
 * ============================================================
 *
 * PAYMENT DISPLAY HELPER
 *
 * ============================================================
 *
 * Helper ini menentukan informasi pembayaran yang
 * ditampilkan di halaman Admin Payments.
 *
 * Priority:
 *
 * QRIS:
 *
 * 1. paymentChannel.type === QRIS
 * 2. Tampilkan QRIS
 *
 * BANK TRANSFER:
 *
 * 1. payment.bankName
 * 2. paymentChannel.bankName
 * 3. paymentChannel.name
 * 4. Fallback
 *
 * ============================================================
 */

function getPaymentDisplay(
  payment: {
    bankName: string | null;
    accountNumber: string | null;
    accountName: string | null;

    order: {
      paymentChannel?: {
        name: string;
        type: string;
        bankName: string | null;
        accountNumber: string | null;
        accountHolder: string | null;
      } | null;
    };
  }
) {
  /**
   * ==========================================================
   * PAYMENT CHANNEL
   * ==========================================================
   */

  const paymentChannel =
    payment.order.paymentChannel;

  /**
   * ==========================================================
   * QRIS DETECTION
   * ==========================================================
   */

  const isQris =
    paymentChannel?.type ===
    "QRIS";

  /**
   * ==========================================================
   * PAYMENT NAME
   * ==========================================================
   */

  const paymentName =
    isQris
      ? "QRIS"
      : (
          payment.bankName ??
          paymentChannel?.bankName ??
          paymentChannel?.name ??
          "Metode pembayaran tidak diketahui"
        );

  /**
   * ==========================================================
   * ACCOUNT NUMBER
   * ==========================================================
   */

  const accountNumber =
    isQris
      ? null
      : (
          payment.accountNumber ??
          paymentChannel?.accountNumber ??
          null
        );

  /**
   * ==========================================================
   * ACCOUNT NAME
   * ==========================================================
   */

  const accountName =
    isQris
      ? null
      : (
          payment.accountName ??
          paymentChannel?.accountHolder ??
          null
        );

  return {
    isQris,
    paymentName,
    accountNumber,
    accountName,
  };
}

/**
 * ============================================================
 *
 * ADMIN PAYMENTS PAGE
 *
 * ============================================================
 */

export default async function AdminPaymentsPage() {
  /**
   * ==========================================================
   * GET PAYMENTS
   * ==========================================================
   */

  const result =
    await PaymentVerificationService.getAll();

  /**
   * ==========================================================
   * NORMALIZE PAYMENTS
   * ==========================================================
   */

  const payments =
    result.success &&
    Array.isArray(result.data)
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
            {
              result.message ??
              "Gagal mengambil data pembayaran."
            }
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

              {/* ==================================================
                  TABLE HEADER
              ================================================== */}

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

              {/* ==================================================
                  TABLE BODY
              ================================================== */}

              <tbody>

                {payments.map(
                  (payment) => {
                    /**
                     * ============================================
                     * GET PAYMENT DISPLAY DATA
                     * ============================================
                     */

                    const paymentDisplay =
                      getPaymentDisplay(
                        payment
                      );

                    return (
                      <tr
                        key={payment.id}
                        className="border-b last:border-b-0 hover:bg-muted/30"
                      >

                        {/* ======================================
                            ORDER
                        ====================================== */}

                        <td className="px-4 py-4">

                          <div className="font-medium">
                            {
                              payment.order
                                .orderNumber
                            }
                          </div>

                        </td>

                        {/* ======================================
                            CUSTOMER
                        ====================================== */}

                        <td className="px-4 py-4">

                          <div className="font-medium">
                            {
                              payment.order.user
                                .name ??
                              "Customer"
                            }
                          </div>

                          <div className="mt-1 text-xs text-muted-foreground">
                            {
                              payment.order.user
                                .email
                            }
                          </div>

                        </td>

                        {/* ======================================
                            PAYMENT
                        ====================================== */}

                        <td className="px-4 py-4">

                          <div className="space-y-1">

                            {/* PAYMENT NAME */}

                            <p className="font-medium">
                              {
                                paymentDisplay
                                  .paymentName
                              }
                            </p>

                            {/* ACCOUNT NUMBER */}

                            {
                              paymentDisplay
                                .accountNumber && (
                                <p className="font-mono text-xs text-muted-foreground">

                                  {
                                    paymentDisplay
                                      .accountNumber
                                  }

                                </p>
                              )
                            }

                            {/* ACCOUNT HOLDER */}

                            {
                              paymentDisplay
                                .accountName && (
                                <p className="text-xs text-muted-foreground">

                                  a.n.{" "}

                                  {
                                    paymentDisplay
                                      .accountName
                                  }

                                </p>
                              )
                            }

                            {/* QRIS LABEL */}

                            {
                              paymentDisplay
                                .isQris && (
                                <p className="text-xs text-muted-foreground">
                                  Pembayaran QRIS
                                </p>
                              )
                            }

                          </div>

                        </td>

                        {/* ======================================
                            UPLOAD TIME
                        ====================================== */}

                        <td className="px-4 py-4 text-muted-foreground">

                          {
                            formatDate(
                              payment.createdAt
                            )
                          }

                        </td>

                        {/* ======================================
                            STATUS
                        ====================================== */}

                        <td className="px-4 py-4 text-center">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                              payment.status
                            )}`}
                          >

                            {
                              getStatusLabel(
                                payment.status
                              )
                            }

                          </span>

                        </td>

                        {/* ======================================
                            ACTION
                        ====================================== */}

                        <td className="px-4 py-4 text-right">

                          <Link
                            href={`/admin/payments/${payment.id}`}
                            className="inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition hover:bg-muted"
                          >
                            Lihat
                          </Link>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

    </div>
  );
}