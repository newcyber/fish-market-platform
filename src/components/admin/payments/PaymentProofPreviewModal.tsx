"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ExternalLink,
  FileImage,
  Loader2,
  X,
  XCircle,
  ZoomIn,
} from "lucide-react";

import {
  rejectPaymentAction,
  verifyPaymentAction,
} from "@/actions/payment/payment-verification.actions";

interface PaymentProofPreviewModalProps {
  image: string;
  paymentProofId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  paymentMethod: string;
  orderTotal: string;
  uploadedAt: string;
  status: string;
}

export default function PaymentProofPreviewModal({
  image,
  paymentProofId,
  orderId,
  orderNumber,
  customerName,
  paymentMethod,
  orderTotal,
  uploadedAt,
  status,
}: PaymentProofPreviewModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const canVerify = status === "PENDING";

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isPending]);

  function closeModal() {
    if (isPending) return;
    setOpen(false);
    setRejectOpen(false);
    setRejectionReason("");
    setFeedback(null);
  }

  function handleVerify() {
    if (!canVerify) return;

    if (!window.confirm("Apakah Anda yakin ingin memverifikasi pembayaran ini?")) {
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      const result = await verifyPaymentAction(paymentProofId);

      if (!result.success) {
        setFeedback({
          type: "error",
          message: result.message ?? "Gagal memverifikasi pembayaran.",
        });
        return;
      }

      setFeedback({
        type: "success",
        message: result.message ?? "Pembayaran berhasil diverifikasi.",
      });
      router.refresh();
    });
  }

  function handleReject() {
    const reason = rejectionReason.trim();

    if (!reason) {
      setFeedback({
        type: "error",
        message: "Alasan penolakan wajib diisi.",
      });
      return;
    }

    if (!window.confirm("Apakah Anda yakin ingin menolak pembayaran ini?")) {
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      const result = await rejectPaymentAction(
        paymentProofId,
        reason
      );

      if (!result.success) {
        setFeedback({
          type: "error",
          message: result.message ?? "Gagal menolak pembayaran.",
        });
        return;
      }

      setFeedback({
        type: "success",
        message: result.message ?? "Pembayaran berhasil ditolak.",
      });
      setRejectOpen(false);
      router.refresh();
      setRejectionReason("");
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFeedback(null);
          setOpen(true);
        }}
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[var(--pisjo-soft-blue)] bg-[var(--pisjo-soft-blue)] px-3 text-xs font-bold text-[var(--pisjo-ocean)] transition hover:bg-[var(--pisjo-primary)] hover:text-white"
      >
        <ZoomIn className="h-3.5 w-3.5" />
        Preview Cepat
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Preview bukti pembayaran"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl" style={{ maxWidth: "min(920px, calc(100vw - 24px))", maxHeight: "calc(100dvh - 24px)" }}>
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)]">
                  <FileImage className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-[var(--pisjo-navy)] sm:text-base">
                    Bukti Pembayaran
                  </h2>
                  <p className="truncate text-[11px] text-[var(--pisjo-text-secondary)]">
                    Preview verifikasi cepat
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                aria-label="Tutup preview"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
              <div className="flex shrink-0 items-center justify-center bg-slate-100 p-3 sm:p-4 lg:min-h-0 lg:flex-1">
                <div className="relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ height: "clamp(190px, 38dvh, 420px)", maxWidth: "520px" }}>
                  <img
                    src={image}
                    alt={`Bukti pembayaran ${orderNumber}`}
                    className="block object-contain" style={{ maxHeight: "100%", maxWidth: "100%", width: "auto", height: "auto" }}
                  />
                </div>
              </div>

              <div className="min-w-0 flex-1 overflow-y-auto border-t border-slate-100 bg-white p-4 sm:p-5 lg:border-l lg:border-t-0 lg:max-w-[400px]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pisjo-primary)]">
                      Informasi Pembayaran
                    </p>
                    <h3 className="mt-1 text-base font-bold text-[var(--pisjo-navy)]">
                      Detail transaksi
                    </h3>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <InfoRow label="Order ID" value={orderNumber} strong />
                  <InfoRow label="Nama Customer" value={customerName || "Customer"} />
                  <InfoRow label="Metode Pembayaran" value={paymentMethod} />
                  <InfoRow label="Nominal Pesanan" value={orderTotal} strong />
                  <InfoRow label="Waktu Upload" value={uploadedAt} />
                  <InfoRow
                    label="Status"
                    value={
                      status === "VERIFIED"
                        ? "Terverifikasi"
                        : status === "REJECTED"
                          ? "Ditolak"
                          : "Menunggu Verifikasi"
                    }
                    status={status}
                  />
                </div>

                {feedback && (
                  <div
                    className={`mt-4 rounded-xl border p-3 text-xs leading-5 ${
                      feedback.type === "success"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {feedback.message}
                  </div>
                )}

                {rejectOpen && canVerify && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                    <label
                      htmlFor={`quick-rejection-${paymentProofId}`}
                      className="text-xs font-semibold text-red-800"
                    >
                      Alasan Penolakan
                    </label>
                    <textarea
                      id={`quick-rejection-${paymentProofId}`}
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      disabled={isPending}
                      rows={3}
                      placeholder="Contoh: bukti tidak jelas atau nominal tidak sesuai."
                      className="mt-2 w-full resize-none rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:opacity-60"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRejectOpen(false)}
                        disabled={isPending}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={isPending}
                        className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {isPending ? "Memproses..." : "Tolak"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Link
                    href={`/admin/orders/${orderId}`}
                    onClick={closeModal}
                    className="col-span-full inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--pisjo-soft-blue)] px-4 text-xs font-bold text-[var(--pisjo-ocean)] transition hover:bg-[var(--pisjo-primary)] hover:text-white"
                  >
                    Lihat Detail Pesanan
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>

                  {canVerify && !rejectOpen && (
                    <>
                      <button
                        type="button"
                        onClick={() => setRejectOpen(true)}
                        disabled={isPending}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Tolak Pembayaran
                      </button>

                      <button
                        type="button"
                        onClick={handleVerify}
                        disabled={isPending}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-3 text-xs font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {isPending ? "Memproses..." : "Verifikasi Pembayaran"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InfoRow({
  label,
  value,
  strong = false,
  status,
}: {
  label: string;
  value: string;
  strong?: boolean;
  status?: string;
}) {
  const statusClass =
    status === "VERIFIED"
      ? "border-green-200 bg-green-50 text-green-700"
      : status === "REJECTED"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <div className="grid grid-cols-[minmax(90px,0.75fr)_minmax(0,1.25fr)] gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-slate-500">{label}</span>
      {status ? (
        <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass}`}>
          {value}
        </span>
      ) : (
        <span className={`break-words text-right text-xs ${strong ? "font-bold text-[var(--pisjo-navy)]" : "font-semibold text-slate-700"}`}>
          {value}
        </span>
      )}
    </div>
  );
}
