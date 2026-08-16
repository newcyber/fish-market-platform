"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  CheckCircle2,
  Loader2,
} from "lucide-react";

import {
  toast,
} from "sonner";

import {
  confirmQrisPaymentAction,
} from "@/actions/payment/confirm-qris-payment";

/**
 * ============================================================
 * QRIS PAYMENT CONFIRMATION BUTTON
 * ============================================================
 */

interface QrisPaymentConfirmationButtonProps {
  orderId: string;

  alreadySubmitted?: boolean;
}

export default function QrisPaymentConfirmationButton({
  orderId,
  alreadySubmitted = false,
}: QrisPaymentConfirmationButtonProps) {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] = useState(false);

  /**
   * ==========================================================
   * HANDLE CONFIRM
   * ==========================================================
   */

  async function handleConfirm() {
    if (loading) {
      return;
    }

    const confirmed =
      window.confirm(
        "Pastikan Anda sudah menyelesaikan pembayaran QRIS sesuai nominal pesanan. Kirim konfirmasi pembayaran?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      const result =
        await confirmQrisPaymentAction(
          orderId
        );

      if (!result.success) {
        toast.error(
          result.message ??
          "Gagal mengirim konfirmasi pembayaran."
        );

        return;
      }

      toast.success(
        result.message ??
        "Konfirmasi pembayaran berhasil dikirim."
      );

      router.refresh();
    } catch (error) {
      console.error(
        "[QRIS_PAYMENT_CONFIRMATION_ERROR]",
        error
      );

      toast.error(
        "Terjadi kesalahan saat mengirim konfirmasi pembayaran."
      );
    } finally {
      setLoading(false);
    }
  }

  /**
   * ==========================================================
   * ALREADY SUBMITTED
   * ==========================================================
   */

  if (alreadySubmitted) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

          <div>
            <p className="font-medium text-amber-800">
              Pembayaran sedang menunggu verifikasi
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-700">
              Konfirmasi pembayaran Anda sudah diterima.
              Admin akan memeriksa pembayaran sebelum pesanan diproses.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ==========================================================
   * BUTTON
   * ==========================================================
   */

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="text-center">
        <p className="font-semibold text-slate-900">
          Sudah melakukan pembayaran?
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Setelah pembayaran QRIS berhasil, klik tombol di bawah
          untuk mengirim konfirmasi pembayaran kepada admin.
        </p>
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={loading}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />

            Mengirim Konfirmasi...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" />

            Saya Sudah Bayar
          </>
        )}
      </button>
    </div>
  );
}