"use client";

import {
  useState,
  useTransition,
} from "react";

import { useRouter } from "next/navigation";

import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";

import {
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

import {
  Button,
} from "@/components/ui/button";

import {
  updateOrderStatusAction,
} from "@/actions/order/update-status";

import {
  cancelOrderAction,
} from "@/actions/order/cancel-order";

interface OrderStatusControlProps {
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}

function getStatusLabel(
  status: OrderStatus
) {
  switch (status) {
    case OrderStatus.PENDING:
      return "Pending";

    case OrderStatus.WAITING_PAYMENT:
      return "Menunggu Pembayaran";

    case OrderStatus.WAITING_VERIFICATION:
      return "Menunggu Verifikasi";

    case OrderStatus.PROCESSING:
      return "Diproses";

    case OrderStatus.SHIPPING:
      return "Dikirim";

    case OrderStatus.COMPLETED:
      return "Selesai";

    case OrderStatus.CANCELLED:
      return "Dibatalkan";

    default:
      return status;
  }
}

function getStatusDescription(
  status: OrderStatus,
  paymentVerified: boolean
) {
  switch (status) {
    case OrderStatus.PENDING:
      return paymentVerified
        ? "Pembayaran sudah terverifikasi. Order siap diproses."
        : "Order belum dapat diproses sebelum pembayaran diverifikasi.";

    case OrderStatus.WAITING_PAYMENT:
      return "Menunggu customer menyelesaikan pembayaran.";

    case OrderStatus.WAITING_VERIFICATION:
      return paymentVerified
        ? "Pembayaran sudah terverifikasi. Order siap diproses."
        : "Periksa bukti pembayaran dan verifikasi terlebih dahulu.";

    case OrderStatus.PROCESSING:
      return "Order sedang dipersiapkan untuk pengiriman.";

    case OrderStatus.SHIPPING:
      return "Order sedang dalam proses pengiriman.";

    case OrderStatus.COMPLETED:
      return "Order sudah selesai dan reward point telah diproses.";

    case OrderStatus.CANCELLED:
      return "Order telah dibatalkan dan tidak dapat diproses kembali.";

    default:
      return "Kelola lifecycle order sesuai proses operasional.";
  }
}

export default function OrderStatusControl({
  orderId,
  status,
  paymentStatus,
}: OrderStatusControlProps) {
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

  const isTerminal =
    status === OrderStatus.COMPLETED ||
    status === OrderStatus.CANCELLED;

  const paymentVerified =
    paymentStatus === PaymentStatus.VERIFIED;

  let nextStatus:
    | OrderStatus
    | null = null;

  let actionLabel = "Lanjutkan";

  let ActionIcon = ChevronRight;

  if (
    status === OrderStatus.PENDING
  ) {
    nextStatus =
      OrderStatus.PROCESSING;

    actionLabel = "Mulai Proses";
    ActionIcon = PackageCheck;
  }

  if (
    status ===
    OrderStatus.WAITING_VERIFICATION
  ) {
    nextStatus =
      OrderStatus.PROCESSING;

    actionLabel = "Mulai Proses";
    ActionIcon = PackageCheck;
  }

  if (
    status === OrderStatus.PROCESSING
  ) {
    nextStatus =
      OrderStatus.SHIPPING;

    actionLabel = "Tandai Dikirim";
    ActionIcon = Truck;
  }

  if (
    status === OrderStatus.SHIPPING
  ) {
    nextStatus =
      OrderStatus.COMPLETED;

    actionLabel = "Selesaikan Order";
    ActionIcon = CheckCircle2;
  }

  function updateStatus(
    targetStatus: OrderStatus
  ) {
    setError("");
    setSuccess("");

    startTransition(async () => {
      const result =
        await updateOrderStatusAction(
          orderId,
          targetStatus
        );

      if (!result.success) {
        setError(
          result.message ??
            "Gagal memperbarui status order."
        );

        return;
      }

      setSuccess(
        result.message ??
          "Status order berhasil diperbarui."
      );

      router.refresh();
    });
  }

  function handleNext() {
    setError("");
    setSuccess("");

    if (!nextStatus) {
      return;
    }

    if (
      nextStatus ===
        OrderStatus.PROCESSING &&
      !paymentVerified
    ) {
      setError(
        "Pembayaran harus terverifikasi sebelum order diproses."
      );

      return;
    }

    updateStatus(nextStatus);
  }

  function handleCancel() {
    setError("");
    setSuccess("");

    const confirmed =
      window.confirm(
        "Yakin ingin membatalkan order ini?\n\nStock produk akan dikembalikan dan order yang sudah dibatalkan tidak dapat diproses kembali."
      );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result =
        await cancelOrderAction(
          orderId
        );

      if (!result.success) {
        setError(
          result.message ??
            "Gagal membatalkan order."
        );

        return;
      }

      setSuccess(
        result.message ??
          "Order berhasil dibatalkan."
      );

      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-[var(--pisjo-soft-blue)] bg-white shadow-sm">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="border-b border-[var(--pisjo-soft-blue)] px-4 py-4 sm:px-6">
        <h2 className="font-semibold text-[var(--pisjo-navy)]">
          Kontrol Status Order
        </h2>

        <p className="mt-1 text-sm leading-5 text-[var(--pisjo-text-secondary)]">
          Kelola lifecycle order sesuai proses operasional.
        </p>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        {/* ===================================================
            CURRENT STATUS
            =================================================== */}

        <div className="rounded-xl border border-[var(--pisjo-soft-blue)] bg-[var(--pisjo-bg)] p-4">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--pisjo-text-secondary)]">
                Status Saat Ini
              </p>

              <p className="mt-1 text-lg font-semibold text-[var(--pisjo-navy)]">
                {getStatusLabel(status)}
              </p>

              <p className="mt-1 text-xs leading-5 text-[var(--pisjo-text-secondary)]">
                {getStatusDescription(
                  status,
                  paymentVerified
                )}
              </p>
            </div>

            <div
              className={[
                "inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold",
                paymentVerified
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-amber-200 bg-amber-50 text-amber-700",
              ].join(" ")}
            >
              {paymentVerified
                ? "Payment Verified"
                : "Payment Belum Verified"}
            </div>
          </div>
        </div>

        {/* ===================================================
            ERROR
            =================================================== */}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
          >
            {error}
          </div>
        )}

        {/* ===================================================
            SUCCESS
            =================================================== */}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-5 text-green-700"
          >
            {success}
          </div>
        )}

        {/* ===================================================
            TERMINAL
            =================================================== */}

        {isTerminal ? (
          <div
            className={[
              "rounded-xl border px-4 py-3 text-sm leading-5",
              status === OrderStatus.COMPLETED
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-slate-200 bg-slate-50 text-[var(--pisjo-text-secondary)]",
            ].join(" ")}
          >
            {status ===
            OrderStatus.COMPLETED
              ? "Order sudah selesai dan merupakan status final."
              : "Order sudah dibatalkan dan tidak dapat diproses kembali."}
          </div>
        ) : (
          <div className="space-y-3">
            {/* =================================================
                PAYMENT WARNING
                ================================================= */}

            {(status === OrderStatus.PENDING ||
              status ===
                OrderStatus.WAITING_VERIFICATION) &&
              !paymentVerified && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">
                  Verifikasi pembayaran terlebih dahulu sebelum
                  melanjutkan order ke tahap proses.
                </div>
              )}

            {/* =================================================
                ACTIONS
                ================================================= */}

            <div className="flex flex-col gap-3 sm:flex-row">
              {nextStatus && (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    isPending ||
                    (nextStatus ===
                      OrderStatus.PROCESSING &&
                      !paymentVerified)
                  }
                  className="min-h-11 w-full flex-1 bg-[var(--pisjo-primary)] text-white hover:bg-[var(--pisjo-ocean)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <ActionIcon className="mr-2 h-4 w-4" />
                      {actionLabel}
                    </>
                  )}
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
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
                    Batalkan Order
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
