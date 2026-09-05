"use client";

import {
  useState,
  useTransition,
} from "react";

import { useRouter } from "next/navigation";

import {
  CheckCircle2,
  XCircle,
  Loader2,
  CreditCard,
} from "lucide-react";

import {
  PaymentStatus,
} from "@prisma/client";

import {
  Button,
} from "@/components/ui/button";

import {
  verifyOrderPaymentAction,
  rejectOrderPaymentAction,
} from "@/actions/order/verify-payment";

interface PaymentVerificationProps {
  orderId: string;
  paymentStatus: PaymentStatus;
  orderStatus: string;
  hasPaymentProof: boolean;
}

export default function PaymentVerification({
  orderId,
  paymentStatus,
  orderStatus,
  hasPaymentProof,
}: PaymentVerificationProps) {
  const router = useRouter();

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const isVerified =
    paymentStatus === PaymentStatus.VERIFIED;

  const isRejected =
    paymentStatus === PaymentStatus.REJECTED;

  const isCancelled =
    orderStatus === "CANCELLED";

  function verifyPayment() {
    setError("");
    setSuccess("");

    if (isCancelled) {
      setError(
        "Order yang sudah dibatalkan tidak dapat diverifikasi."
      );

      return;
    }

    if (isVerified) {
      setError(
        "Pembayaran sudah terverifikasi."
      );

      return;
    }

    if (!hasPaymentProof) {
      setError(
        "Belum ada bukti pembayaran yang dapat diverifikasi."
      );

      return;
    }

    startTransition(async () => {
      const result =
        await verifyOrderPaymentAction(
          orderId
        );

      if (!result.success) {
        setError(
          result.message ??
            "Gagal memverifikasi pembayaran."
        );

        return;
      }

      setSuccess(
        result.message ??
          "Pembayaran berhasil diverifikasi."
      );

      router.refresh();
    });
  }

  function rejectPayment() {
    setError("");
    setSuccess("");

    if (isCancelled) {
      setError(
        "Order yang sudah dibatalkan tidak dapat diproses."
      );

      return;
    }

    if (isVerified) {
      setError(
        "Pembayaran yang sudah terverifikasi tidak dapat ditolak kembali."
      );

      return;
    }

    if (!hasPaymentProof) {
      setError(
        "Belum ada bukti pembayaran yang dapat ditolak."
      );

      return;
    }

    startTransition(async () => {
      const result =
        await rejectOrderPaymentAction(
          orderId
        );

      if (!result.success) {
        setError(
          result.message ??
            "Gagal menolak pembayaran."
        );

        return;
      }

      setSuccess(
        result.message ??
          "Pembayaran berhasil ditolak."
      );

      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* =====================================================
          PAYMENT STATUS
          ===================================================== */}

      <div
        className={[
          "rounded-xl border p-4",
          isVerified
            ? "border-green-200 bg-green-50"
            : isRejected
              ? "border-red-200 bg-red-50"
              : "border-[var(--pisjo-soft-blue)] bg-[var(--pisjo-bg)]",
        ].join(" ")}
      >
        <div className="flex min-w-0 items-start gap-3">
          {isVerified ? (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          ) : isRejected ? (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pisjo-soft-blue)]">
              <CreditCard className="h-5 w-5 text-[var(--pisjo-primary)]" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p
              className={[
                "text-sm font-semibold",
                isVerified
                  ? "text-green-800"
                  : isRejected
                    ? "text-red-800"
                    : "text-[var(--pisjo-navy)]",
              ].join(" ")}
            >
              {isVerified
                ? "Pembayaran Terverifikasi"
                : isRejected
                  ? "Pembayaran Ditolak"
                  : "Menunggu Verifikasi"}
            </p>

            <p className="mt-1 text-xs leading-5 text-[var(--pisjo-text-secondary)]">
              {isVerified
                ? "Pembayaran sudah diverifikasi dan tidak dapat diturunkan kembali."
                : isRejected
                  ? hasPaymentProof
                    ? "Pembayaran sebelumnya ditolak. Bukti pembayaran baru dapat diperiksa dan diverifikasi kembali."
                    : "Pembayaran sebelumnya ditolak. Tunggu customer mengirim bukti pembayaran baru."
                  : hasPaymentProof
                    ? "Periksa bukti pembayaran sebelum melakukan verifikasi."
                    : "Belum ada bukti pembayaran yang terhubung pada order ini."}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
        >
          {error}
        </div>
      )}

      {/* =====================================================
          SUCCESS
          ===================================================== */}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-5 text-green-700"
        >
          {success}
        </div>
      )}

      {/* =====================================================
          ACTIONS
          ===================================================== */}

      {!isVerified && !isCancelled && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={verifyPayment}
            disabled={
              isPending ||
              !hasPaymentProof
            }
            className="min-h-11 w-full flex-1 bg-[var(--pisjo-primary)] text-white hover:bg-[var(--pisjo-ocean)]"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isRejected
                  ? "Verifikasi Bukti Baru"
                  : "Verifikasi Pembayaran"}
              </>
            )}
          </Button>

          {!isRejected && (
            <Button
              type="button"
              variant="outline"
              onClick={rejectPayment}
              disabled={
                isPending ||
                !hasPaymentProof
              }
              className="min-h-11 w-full flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Tolak Pembayaran
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* =====================================================
          VERIFIED INFO
          ===================================================== */}

      {isVerified && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-5 text-green-800">
          Pembayaran sudah terverifikasi. Tidak ada
          tindakan lanjutan yang diperlukan.
        </div>
      )}

      {/* =====================================================
          CANCELLED INFO
          ===================================================== */}

      {isCancelled && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-5 text-[var(--pisjo-text-secondary)]">
          Order sudah dibatalkan sehingga status pembayaran
          tidak dapat diubah.
        </div>
      )}
    </div>
  );
}
