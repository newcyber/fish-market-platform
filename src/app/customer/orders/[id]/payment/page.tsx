import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  ShieldCheck,
} from "lucide-react";

import {
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

import { auth } from "@/auth";

import OrderService from "@/services/order/order.service";

import PaymentProofForm from "@/components/customer/payment/PaymentProofForm";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface PaymentPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * ============================================================
 * PAYMENT PAGE
 * ============================================================
 */

export default async function PaymentPage({
  params,
}: PaymentPageProps) {
  /**
   * ==========================================================
   * AUTHENTICATION
   * ==========================================================
   */

  const session =
    await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  /**
   * ==========================================================
   * GET PARAMS
   * ==========================================================
   */

  const {
    id,
  } = await params;

  /**
   * ==========================================================
   * GET ORDER
   * ==========================================================
   */

  let order;

  try {
    order =
      await OrderService.getOrderById(
        id
      );
  } catch {
    notFound();
  }

  /**
   * ==========================================================
   * SECURITY
   *
   * Customer hanya boleh membuka
   * halaman pembayaran miliknya sendiri.
   * ==========================================================
   */

  if (
    order.userId !==
    session.user.id
  ) {
    notFound();
  }

  /**
   * ==========================================================
   * SOFT DELETE VALIDATION
   * ==========================================================
   */

  if (order.deletedAt) {
    notFound();
  }

  /**
 * ==========================================================
 * PAYMENT VALIDATION
 *
 * Customer masih dapat mengakses halaman upload selama
 * pembayaran belum terverifikasi dan order belum selesai
 * atau dibatalkan.
 * ==========================================================
 */

if (
  order.paymentStatus === PaymentStatus.VERIFIED ||
  order.status === OrderStatus.COMPLETED ||
  order.status === OrderStatus.CANCELLED
) {
  redirect(
    `/customer/orders/${order.id}`
  );
}

  /**
   * ==========================================================
   * FORMAT TOTAL
   * ==========================================================
   */

  const formattedTotal =
    new Intl.NumberFormat(
      "id-ID",
      {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }
    ).format(
      Number(order.total)
    );

  /**
   * ==========================================================
   * PAYMENT PROOF STATUS
   * ==========================================================
   */

  const hasPaymentProof =
    Boolean(order.paymentProof);

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        {/* ================================================== */}
        {/* BACK */}
        {/* ================================================== */}

        <Link
          href={`/customer/orders/${order.id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />

          Kembali ke Detail Pesanan
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {/* ================================================ */}
          {/* HEADER */}
          {/* ================================================ */}

          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <CreditCard className="h-6 w-6 text-slate-700" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-950">
                Upload Bukti Pembayaran
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Upload bukti transfer untuk pesanan{" "}
                <span className="font-medium text-slate-700">
                  {order.orderNumber}
                </span>
                .
              </p>
            </div>
          </div>

          {/* ================================================ */}
          {/* ORDER SUMMARY */}
          {/* ================================================ */}

          <div className="mb-6 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">
                  Total Pembayaran
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {formattedTotal}
                </p>
              </div>

              {hasPaymentProof ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                  <Clock3 className="h-4 w-4" />

                  Bukti Sudah Dikirim
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <CreditCard className="h-4 w-4" />

                  Menunggu Pembayaran
                </div>
              )}
            </div>
          </div>

          {/* ================================================ */}
          {/* EXISTING PAYMENT PROOF INFO */}
          {/* ================================================ */}

          {hasPaymentProof && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

              <div>
                <p className="font-medium text-amber-800">
                  Bukti pembayaran sudah dikirim
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-700">
                  Anda dapat mengirim ulang bukti pembayaran
                  jika ingin mengganti file sebelumnya.
                  Bukti terbaru akan digunakan untuk proses
                  verifikasi oleh admin.
                </p>
              </div>
            </div>
          )}

          {/* ================================================ */}
          {/* PAYMENT FORM */}
          {/* ================================================ */}

          <PaymentProofForm
            orderId={order.id}
          />

          {/* ================================================ */}
          {/* SECURITY INFO */}
          {/* ================================================ */}

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 p-4">
            {hasPaymentProof ? (
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
            ) : (
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
            )}

            <div>
              <p className="text-sm font-medium text-slate-700">
                {hasPaymentProof
                  ? "Menunggu verifikasi admin"
                  : "Pembayaran aman dan tercatat"}
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                {hasPaymentProof
                  ? "Admin akan memeriksa bukti pembayaran Anda. Jika diperlukan, Anda masih dapat mengganti bukti pembayaran sebelum pembayaran diverifikasi."
                  : "Setelah bukti pembayaran dikirim, pesanan akan masuk ke tahap verifikasi oleh admin."}
              </p>
            </div>
          </div>

          {/* ================================================ */}
          {/* SUCCESS INDICATOR */}
          {/* ================================================ */}

          {hasPaymentProof && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />

              Bukti pembayaran tersimpan.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}