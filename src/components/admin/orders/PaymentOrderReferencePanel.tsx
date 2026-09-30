"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CreditCard,
  PackageCheck,
  Play,
  Trash2,
  XCircle,
} from "lucide-react";
import { OrderStatus, PaymentStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  updateOrderStatusAction,
} from "@/actions/order/update-status";
import {
  cancelOrderAction,
} from "@/actions/order/cancel-order";
import {
  rejectPaymentAction,
  verifyPaymentAction,
} from "@/actions/payment/payment-verification.actions";

interface PaymentOrderReferencePanelProps {
  orderId: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  hasPaymentProof: boolean;
  paymentProofId: string | null;
  paymentStatusLabel: string;
  orderStatusLabel: string;
}

function getNextStatus(status: OrderStatus) {
  switch (status) {
    case OrderStatus.PENDING:
    case OrderStatus.WAITING_VERIFICATION:
      return OrderStatus.PROCESSING;
    case OrderStatus.PROCESSING:
      return OrderStatus.SHIPPING;
    case OrderStatus.SHIPPING:
      return OrderStatus.COMPLETED;
    default:
      return null;
  }
}

function getNextLabel(status: OrderStatus) {
  switch (status) {
    case OrderStatus.PENDING:
    case OrderStatus.WAITING_VERIFICATION:
      return "Mulai Proses Order";
    case OrderStatus.PROCESSING:
      return "Tandai Dikirim";
    case OrderStatus.SHIPPING:
      return "Selesaikan Order";
    default:
      return "Lanjutkan Order";
  }
}

function getStatusDescription(status: OrderStatus, paymentVerified: boolean) {
  switch (status) {
    case OrderStatus.PENDING:
    case OrderStatus.WAITING_VERIFICATION:
      return paymentVerified
        ? "Pembayaran sudah diverifikasi. Order siap diproses."
        : "Order belum diproses. Menunggu pembayaran atau verifikasi.";
    case OrderStatus.PROCESSING:
      return "Order sedang diproses dan siap untuk dikirim.";
    case OrderStatus.SHIPPING:
      return "Order sedang dalam proses pengiriman.";
    case OrderStatus.COMPLETED:
      return "Order sudah selesai dan merupakan status final.";
    case OrderStatus.CANCELLED:
      return "Order sudah dibatalkan dan tidak dapat diproses kembali.";
    default:
      return "Kelola status order sesuai proses operasional.";
  }
}

export default function PaymentOrderReferencePanel({
  orderId,
  paymentMethod,
  paymentStatus,
  orderStatus,
  hasPaymentProof,
  paymentProofId,
  paymentStatusLabel,
  orderStatusLabel,
}: PaymentOrderReferencePanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const paymentVerified = paymentStatus === PaymentStatus.VERIFIED;
  const paymentRejected = paymentStatus === PaymentStatus.REJECTED;
  const terminal =
    orderStatus === OrderStatus.COMPLETED ||
    orderStatus === OrderStatus.CANCELLED;
  const nextStatus = getNextStatus(orderStatus);

  function verifyPayment() {
    setError("");
    setSuccess("");

    if (!paymentProofId) {
      setError("Bukti pembayaran tidak tersedia.");
      return;
    }

    startTransition(async () => {
      const result = await verifyPaymentAction(paymentProofId);
      if (!result.success) {
        setError(result.message ?? "Gagal memverifikasi pembayaran.");
        return;
      }
      setSuccess(result.message ?? "Pembayaran berhasil diverifikasi.");
      router.refresh();
    });
  }

  function rejectPayment() {
    setError("");
    setSuccess("");

    if (!paymentProofId) {
      setError("Bukti pembayaran tidak tersedia.");
      return;
    }

    const reason = window.prompt(
      "Masukkan alasan penolakan pembayaran:",
    )?.trim();

    if (!reason) {
      return;
    }

    startTransition(async () => {
      const result = await rejectPaymentAction(paymentProofId, reason);
      if (!result.success) {
        setError(result.message ?? "Gagal menolak pembayaran.");
        return;
      }
      setSuccess(result.message ?? "Pembayaran berhasil ditolak.");
      router.refresh();
    });
  }

  function processNextStatus() {
    if (!nextStatus) return;

    setError("");
    setSuccess("");

    if (nextStatus === OrderStatus.PROCESSING && !paymentVerified) {
      setError("Pembayaran harus terverifikasi sebelum order diproses.");
      return;
    }

    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, nextStatus);
      if (!result.success) {
        setError(result.message ?? "Gagal memperbarui status order.");
        return;
      }
      setSuccess(result.message ?? "Status order berhasil diperbarui.");
      router.refresh();
    });
  }

  function cancelOrder() {
    setError("");
    setSuccess("");

    if (!window.confirm("Yakin ingin membatalkan order ini?\n\nStock produk akan dikembalikan dan order yang sudah dibatalkan tidak dapat diproses kembali.")) {
      return;
    }

    startTransition(async () => {
      const result = await cancelOrderAction(orderId);
      if (!result.success) {
        setError(result.message ?? "Gagal membatalkan order.");
        return;
      }
      setSuccess(result.message ?? "Order berhasil dibatalkan.");
      router.refresh();
    });
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-ocean)]">
          <CreditCard className="h-4.5 w-4.5" />
        </span>
        <h2 className="text-sm font-bold text-[var(--pisjo-navy)] sm:text-base">
          Pembayaran &amp; Status Order
        </h2>
      </div>

      <div className="px-4 py-3 sm:px-5 sm:py-4">
        <div className="grid grid-cols-2 gap-0 border-b border-slate-100 pb-3">
          <div className="min-w-0 border-r border-slate-100 pr-4">
            <p className="text-xs font-medium text-[var(--pisjo-text-secondary)]">
              Metode Pembayaran
            </p>
            <p className="mt-2 text-base font-extrabold uppercase leading-none text-[var(--pisjo-navy)]">
              {paymentMethod.replace(/_/g, " ")}
            </p>
          </div>
          <div className="min-w-0 pl-4">
            <p className="text-xs font-medium text-[var(--pisjo-text-secondary)]">
              Status Pembayaran
            </p>
            <span className="mt-1.5 inline-flex rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              {paymentStatusLabel}
            </span>
            <p className="mt-1.5 text-xs text-[var(--pisjo-text-secondary)]">
              Dibayar <span className="float-right text-[var(--pisjo-navy)]">-</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={!hasPaymentProof || !paymentProofId || isPending}
          onClick={() => paymentProofId && router.push(`/admin/payments/${paymentProofId}`)}
          className="mt-3 flex w-full items-center gap-3 rounded-xl bg-[var(--pisjo-soft-blue)]/55 px-3.5 py-2.5 text-left transition hover:bg-[var(--pisjo-soft-blue)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-ocean)]">
            <CreditCard className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-[var(--pisjo-navy)]">Bukti Pembayaran</span>
            <span className="mt-0.5 block truncate text-xs text-[var(--pisjo-text-secondary)]">
              {hasPaymentProof
                ? "Buka bukti pembayaran yang terhubung pada order ini."
                : "Belum ada bukti pembayaran yang terhubung pada order ini."}
            </span>
          </span>
        </button>

        <div className="my-3 border-t border-slate-100" />

        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-navy)]">
            <PackageCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-[var(--pisjo-navy)]">Status Order</h3>
              <span className="inline-flex shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {orderStatusLabel}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-[var(--pisjo-text-secondary)]">
              {getStatusDescription(orderStatus, paymentVerified)}
            </p>
          </div>
        </div>

        {error ? (
          <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div role="status" className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs leading-5 text-green-700">
            {success}
          </div>
        ) : null}

        {!terminal ? (
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              onClick={verifyPayment}
              disabled={isPending || paymentVerified || !hasPaymentProof || !paymentProofId}
              className="min-h-10 w-full rounded-lg bg-[var(--pisjo-primary)] px-3 text-xs font-semibold text-white hover:bg-[var(--pisjo-ocean)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              {paymentRejected ? "Verifikasi Bukti Baru" : "Verifikasi Pembayaran"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={rejectPayment}
              disabled={isPending || paymentVerified || !hasPaymentProof || !paymentProofId}
              className="min-h-10 w-full rounded-lg border-red-300 bg-red-50/50 px-3 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Tolak Pembayaran
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={processNextStatus}
              disabled={isPending || !nextStatus || (nextStatus === OrderStatus.PROCESSING && !paymentVerified)}
              className="min-h-10 w-full rounded-lg border-[var(--pisjo-ocean)]/60 bg-white px-3 text-xs font-semibold text-[var(--pisjo-ocean)] hover:bg-[var(--pisjo-soft-blue)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="mr-1.5 h-4 w-4" />
              {getNextLabel(orderStatus)}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={cancelOrder}
              disabled={isPending}
              className="min-h-10 w-full rounded-lg border-red-300 bg-red-50/50 px-3 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Batalkan Order
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
