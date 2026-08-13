"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  CheckCircle2,
  XCircle,
  Loader2,
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
    paymentStatus ===
    PaymentStatus.VERIFIED;

  const isRejected =
    paymentStatus ===
    PaymentStatus.REJECTED;

  const isCancelled =
    orderStatus ===
    "CANCELLED";

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

    startTransition(
      async () => {
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

        window.location.reload();
      }
    );
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

    startTransition(
      async () => {
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

        window.location.reload();
      }
    );
  }

  return (
    <div className="space-y-4">
      {/* STATUS */}

      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          {isVerified ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          ) : isRejected ? (
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-500" />
          )}

          <div>
            <p className="text-sm font-medium">
              {isVerified
                ? "Pembayaran Terverifikasi"
                : isRejected
                  ? "Pembayaran Ditolak"
                  : "Menunggu Verifikasi"}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {isVerified
                ? "Pembayaran sudah diverifikasi dan tidak dapat diturunkan kembali."
                : isRejected
                  ? "Pembayaran saat ini berstatus ditolak."
                  : hasPaymentProof
                    ? "Periksa pembayaran sebelum melakukan verifikasi."
                    : "Belum ada bukti pembayaran yang terhubung pada order ini."}
            </p>
          </div>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ACTION */}

      {!isVerified &&
        !isCancelled && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={
                verifyPayment
              }
              disabled={
                isPending
              }
              className="flex-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Verifikasi Pembayaran
                </>
              )}
            </Button>

            {!isRejected && (
              <Button
                type="button"
                variant="outline"
                onClick={
                  rejectPayment
                }
                disabled={
                  isPending
                }
                className="flex-1"
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

      {isVerified && (
        <div className="rounded-lg border px-4 py-3 text-sm">
          Pembayaran sudah terverifikasi. Tidak ada
          tindakan lanjutan yang diperlukan.
        </div>
      )}

      {isCancelled && (
        <div className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
          Order sudah dibatalkan sehingga pembayaran
          tidak dapat diubah.
        </div>
      )}
    </div>
  );
}