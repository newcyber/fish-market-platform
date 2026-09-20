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
  verifyPaymentAction,
  rejectPaymentAction,
} from "@/actions/payment/payment-verification.actions";

interface PaymentVerificationProps {
  orderId: string;
  paymentStatus: PaymentStatus;
  orderStatus: string;
  hasPaymentProof: boolean;
  paymentProofId: string | null;
}

export default function PaymentVerification({
  orderId,
  paymentStatus,
  orderStatus,
  hasPaymentProof,
  paymentProofId,
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

  const [
    rejectionReason,
    setRejectionReason,
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

    if (!paymentProofId) {
      setError(
        "Bukti pembayaran tidak tersedia."
      );

      return;
    }

    startTransition(async () => {
      const result = await verifyPaymentAction(
        paymentProofId
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

    if (!paymentProofId) {
      setError(
        "Bukti pembayaran tidak tersedia."
      );

      return;
    }

    const normalizedReason =
      rejectionReason.trim();

    if (!normalizedReason) {
      setError(
        "Alasan penolakan wajib diisi."
      );

      return;
    }

    startTransition(async () => {
      const result = await rejectPaymentAction(
        paymentProofId,
        normalizedReason
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

      setRejectionReason("");

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
          VIEW PAYMENT PROOF
          ===================================================== */}

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={
            !hasPaymentProof ||
            !paymentProofId ||
            isPending
          }
          onClick={() => {
            if (!paymentProofId) {
              return;
            }

            router.push(
              `/admin/payments/${paymentProofId}`
            );
          }}
          className="min-h-11 w-full border-[var(--pisjo-primary)] text-[var(--pisjo-primary)] hover:bg-[var(--pisjo-bg)]"
        >
          <CreditCard className="mr-2 h-4 w-4" />

          {hasPaymentProof
            ? "Lihat Bukti Pembayaran"
            : "Bukti Pembayaran Belum Tersedia"}
        </Button>

        {!hasPaymentProof && (
          <p className="text-xs leading-5 text-[var(--pisjo-text-secondary)]">
            Customer belum mengunggah bukti pembayaran.
            Tombol akan aktif setelah bukti tersedia.
          </p>
        )}
      </div>

      {/* =====================================================
          REJECTION REASON
          ===================================================== */}

      {!isVerified &&
        !isCancelled &&
        hasPaymentProof && (
          <div className="space-y-2">
            <label
              htmlFor="payment-rejection-reason"
              className="text-sm font-medium text-[var(--pisjo-navy)]"
            >
              Alasan Penolakan Pembayaran
            </label>

            <textarea
              id="payment-rejection-reason"
              value={rejectionReason}
              onChange={(event) => {
                setRejectionReason(
                  event.target.value
                );
              }}
              placeholder="Contoh: Nominal transfer tidak sesuai dengan total pembayaran."
              rows={4}
              maxLength={500}
              disabled={isPending}
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-[var(--pisjo-primary)] focus:ring-2 focus:ring-[var(--pisjo-primary)]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
            />

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs leading-5 text-[var(--pisjo-text-secondary)]">
                Alasan akan disimpan pada data bukti pembayaran.
              </p>

              <span className="shrink-0 text-xs text-[var(--pisjo-text-secondary)]">
                {rejectionReason.length}/500
              </span>
            </div>
          </div>
        )}

      {/* =====================================================
          VERIFY & REJECT PAYMENT
          ===================================================== */}

      {!isVerified && !isCancelled && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* VERIFY BUTTON */}

          <Button
            type="button"
            onClick={verifyPayment}
            disabled={
              isPending ||
              !hasPaymentProof ||
              !paymentProofId
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

          {/* REJECT BUTTON */}

          {!isRejected && (
            <Button
              type="button"
              variant="outline"
              onClick={rejectPayment}
              disabled={
                isPending ||
                !hasPaymentProof ||
                !paymentProofId ||
                !rejectionReason.trim()
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
