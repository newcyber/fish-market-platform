"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileImage,
  Loader2,
  X,
  XCircle,
} from "lucide-react";

import {
  rejectPaymentAction,
  verifyPaymentAction,
} from "@/actions/payment/payment-verification.actions";

type QuickPreviewPayment = {
  id: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | string;
  image: string | null;
  createdAt: string;
  verifiedAt: string | null;
  rejectionReason: string | null;
  order: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    user: {
      name: string;
      email: string;
    };
    paymentChannel: {
      name: string;
      type: string;
    } | null;
  };
};

interface PaymentQuickPreviewModalProps {
  payments: QuickPreviewPayment[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: string) {
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

function statusClass(status: string) {
  switch (status) {
    case "VERIFIED":
      return "border-green-200 bg-green-50 text-green-700";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function statusIcon(status: string) {
  if (status === "VERIFIED") {
    return <CheckCircle2 className="h-4 w-4" />;
  }

  if (status === "REJECTED") {
    return <XCircle className="h-4 w-4" />;
  }

  return <Clock3 className="h-4 w-4" />;
}

export default function PaymentQuickPreviewModal({
  payments,
}: PaymentQuickPreviewModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedPayment =
    payments.find((payment) => payment.id === selectedId) ?? null;

  const canVerify = selectedPayment?.status === "PENDING";

  function openPreview(id: string) {
    setSelectedId(id);
    setRejectOpen(false);
    setRejectionReason("");
    setFeedback(null);
  }

  function closePreview() {
    if (isPending) {
      return;
    }

    setSelectedId(null);
    setRejectOpen(false);
    setRejectionReason("");
    setFeedback(null);
  }

  useEffect(() => {
    function handlePreviewClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const trigger = target?.closest<HTMLElement>("[data-payment-preview]");

      if (!trigger) {
        return;
      }

      const id = trigger.dataset.paymentPreview;

      if (id) {
        openPreview(id);
      }
    }

    document.addEventListener("click", handlePreviewClick);

    return () => {
      document.removeEventListener("click", handlePreviewClick);
    };
  }, [payments]);

  useEffect(() => {
    if (!selectedPayment) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        closePreview();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPayment, isPending]);

  function handleVerify() {
    if (!selectedPayment || selectedPayment.status !== "PENDING") {
      return;
    }

    if (
      !window.confirm(
        "Apakah Anda yakin ingin memverifikasi pembayaran ini?"
      )
    ) {
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      const result = await verifyPaymentAction(selectedPayment.id);

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

      window.location.reload();
    });
  }

  function handleReject() {
    if (!selectedPayment || selectedPayment.status !== "PENDING") {
      return;
    }

    const reason = rejectionReason.trim();

    if (!reason) {
      setFeedback({
        type: "error",
        message: "Alasan penolakan wajib diisi.",
      });
      return;
    }

    if (
      !window.confirm("Apakah Anda yakin ingin menolak pembayaran ini?")
    ) {
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      const result = await rejectPaymentAction(
        selectedPayment.id,
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
      setRejectionReason("");
      window.location.reload();
    });
  }

  if (!selectedPayment) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Preview bukti pembayaran"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closePreview();
        }
      }}
    >
      <div
        className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl"
        style={{
          maxWidth: "min(920px, calc(100vw - 24px))",
          maxHeight: "calc(100dvh - 24px)",
        }}
      >
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
            onClick={closePreview}
            disabled={isPending}
            aria-label="Tutup preview"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <div className="flex shrink-0 items-center justify-center bg-slate-100 p-3 sm:p-4 lg:min-h-0 lg:flex-1">
            <div
              className="relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              style={{
                height: "clamp(190px, 38dvh, 420px)",
                maxWidth: "520px",
              }}
            >
              {selectedPayment.image ? (
                <img
                  src={selectedPayment.image}
                  alt={`Bukti pembayaran ${selectedPayment.order.orderNumber}`}
                  className="block object-contain"
                  style={{
                    maxHeight: "100%",
                    maxWidth: "100%",
                    width: "auto",
                    height: "auto",
                  }}
                />
              ) : (
                <div className="px-6 text-center">
                  <FileCheck2 className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-500">
                    Bukti pembayaran tidak tersedia
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1 overflow-y-auto border-t border-slate-100 bg-white p-4 sm:p-5 lg:max-w-[400px] lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pisjo-primary)]">
                  Informasi Pembayaran
                </p>
                <h3 className="mt-1 text-base font-bold text-[var(--pisjo-navy)]">
                  Detail transaksi
                </h3>
              </div>

              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass(
                  selectedPayment.status
                )}`}
              >
                {statusIcon(selectedPayment.status)}
                {statusLabel(selectedPayment.status)}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <InfoRow
                label="Order ID"
                value={selectedPayment.order.orderNumber}
                strong
              />
              <InfoRow
                label="Nama Customer"
                value={selectedPayment.order.user.name || "Customer"}
              />
              <InfoRow
                label="Metode Pembayaran"
                value={
                  selectedPayment.order.paymentChannel?.type === "QRIS"
                    ? "QRIS"
                    : selectedPayment.order.paymentChannel?.name ??
                      "Metode pembayaran tidak diketahui"
                }
              />
              <InfoRow
                label="Nominal Pesanan"
                value={formatCurrency(selectedPayment.order.total)}
                strong
              />
              <InfoRow
                label="Waktu Upload"
                value={formatDate(selectedPayment.createdAt)}
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
                  htmlFor={`quick-rejection-${selectedPayment.id}`}
                  className="text-xs font-semibold text-red-800"
                >
                  Alasan Penolakan
                </label>

                <textarea
                  id={`quick-rejection-${selectedPayment.id}`}
                  value={rejectionReason}
                  onChange={(event) =>
                    setRejectionReason(event.target.value)
                  }
                  disabled={isPending}
                  rows={3}
                  placeholder="Contoh: bukti tidak jelas atau nominal tidak sesuai."
                  className="mt-2 w-full resize-none rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:opacity-60"
                />

                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectOpen(false);
                      setRejectionReason("");
                      setFeedback(null);
                    }}
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
                href={`/admin/orders/${selectedPayment.order.id}`}
                onClick={closePreview}
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
                    {isPending
                      ? "Memproses..."
                      : "Verifikasi Pembayaran"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(90px,0.75fr)_minmax(0,1.25fr)] gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span
        className={`break-words text-right text-xs ${
          strong
            ? "font-bold text-[var(--pisjo-navy)]"
            : "font-semibold text-slate-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
