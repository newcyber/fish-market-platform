"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";

import {
  rejectPaymentAction,
  verifyPaymentAction,
} from "@/actions/payment/payment-verification.actions";

/**
 * ============================================================
 *
 * PAYMENT VERIFICATION ACTIONS
 *
 * Client Component untuk proses verifikasi atau penolakan
 * bukti pembayaran oleh Admin.
 *
 * ============================================================
 */

interface PaymentVerificationActionsProps {
  paymentProofId: string;
}

/**
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export default function PaymentVerificationActions({
  paymentProofId,
}: PaymentVerificationActionsProps) {
  const [
    isRejectFormOpen,
    setIsRejectFormOpen,
  ] = useState(false);

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  const [
    feedback,
    setFeedback,
  ] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [
    isVerifyPending,
    startVerifyTransition,
  ] = useTransition();

  const [
    isRejectPending,
    startRejectTransition,
  ] = useTransition();

  const isPending =
    isVerifyPending ||
    isRejectPending;

  /**
   * ==========================================================
   * VERIFY PAYMENT
   * ==========================================================
   */

  function handleVerify() {
    const confirmed =
      window.confirm(
        "Apakah Anda yakin ingin memverifikasi pembayaran ini?"
      );

    if (!confirmed) {
      return;
    }

    setFeedback(null);

    startVerifyTransition(async () => {
      const result =
        await verifyPaymentAction(
          paymentProofId
        );

      if (!result.success) {
        setFeedback({
          type: "error",
          message:
            result.message ??
            "Gagal memverifikasi pembayaran.",
        });

        return;
      }

      setFeedback({
        type: "success",
        message:
          result.message ??
          "Pembayaran berhasil diverifikasi.",
      });
    });
  }

  /**
   * ==========================================================
   * OPEN REJECT FORM
   * ==========================================================
   */

  function handleOpenRejectForm() {
    setFeedback(null);
    setIsRejectFormOpen(true);
  }

  /**
   * ==========================================================
   * CANCEL REJECT
   * ==========================================================
   */

  function handleCancelReject() {
    if (isPending) {
      return;
    }

    setIsRejectFormOpen(false);
    setRejectionReason("");
    setFeedback(null);
  }

  /**
   * ==========================================================
   * REJECT PAYMENT
   * ==========================================================
   */

  function handleReject() {
    const reason =
      rejectionReason.trim();

    if (!reason) {
      setFeedback({
        type: "error",
        message:
          "Alasan penolakan wajib diisi.",
      });

      return;
    }

    const confirmed =
      window.confirm(
        "Apakah Anda yakin ingin menolak pembayaran ini?"
      );

    if (!confirmed) {
      return;
    }

    setFeedback(null);

    startRejectTransition(async () => {
      const result =
        await rejectPaymentAction(
          paymentProofId,
          reason
        );

      if (!result.success) {
        setFeedback({
          type: "error",
          message:
            result.message ??
            "Gagal menolak pembayaran.",
        });

        return;
      }

      setFeedback({
        type: "success",
        message:
          result.message ??
          "Pembayaran berhasil ditolak.",
      });

      setRejectionReason("");
      setIsRejectFormOpen(false);
    });
  }

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="border-b p-5">
        <h2 className="font-semibold">
          Tindakan Verifikasi
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Periksa kembali bukti pembayaran sebelum
          melakukan verifikasi atau penolakan.
        </p>
      </div>

      <div className="space-y-4 p-5">
        {/* ====================================================
            FEEDBACK
        ==================================================== */}

        {feedback && (
          <div
            className={`rounded-lg border p-3 text-sm ${
              feedback.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* ====================================================
            NORMAL ACTIONS
        ==================================================== */}

        {!isRejectFormOpen && (
          <>
            <button
              type="button"
              onClick={handleVerify}
              disabled={isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isVerifyPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  Memverifikasi...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />

                  Verifikasi Pembayaran
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenRejectForm}
              disabled={isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" />

              Tolak Pembayaran
            </button>
          </>
        )}

        {/* ====================================================
            REJECT FORM
        ==================================================== */}

        {isRejectFormOpen && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="rejectionReason"
                className="mb-2 block text-sm font-medium"
              >
                Alasan Penolakan
              </label>

              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(event) =>
                  setRejectionReason(
                    event.target.value
                  )
                }
                disabled={isPending}
                placeholder="Contoh: Bukti transfer tidak jelas atau nominal pembayaran tidak sesuai."
                rows={5}
                className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-2 text-xs text-muted-foreground">
                Alasan ini akan digunakan sebagai informasi
                untuk customer.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelReject}
                disabled={isPending}
                className="inline-flex flex-1 items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={
                  isPending ||
                  !rejectionReason.trim()
                }
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRejectPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />

                    Memproses...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />

                    Konfirmasi Penolakan
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}