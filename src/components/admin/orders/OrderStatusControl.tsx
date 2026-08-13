"use client";

import {
  useState,
  useTransition,
} from "react";

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

export default function OrderStatusControl({
  orderId,
  status,
  paymentStatus,
}: OrderStatusControlProps) {
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
    status ===
      OrderStatus.COMPLETED ||
    status ===
      OrderStatus.CANCELLED;

  const paymentVerified =
    paymentStatus ===
    PaymentStatus.VERIFIED;

  let nextStatus:
    | OrderStatus
    | null = null;

  let actionLabel =
    "Lanjutkan";

  let ActionIcon =
    ChevronRight;

  if (
    status ===
    OrderStatus.PENDING
  ) {
    nextStatus =
      OrderStatus.PROCESSING;

    actionLabel =
      "Mulai Proses";

    ActionIcon =
      PackageCheck;
  }

  if (
    status ===
    OrderStatus.WAITING_VERIFICATION
  ) {
    nextStatus =
      OrderStatus.PROCESSING;

    actionLabel =
      "Mulai Proses";

    ActionIcon =
      PackageCheck;
  }

  if (
    status ===
    OrderStatus.PROCESSING
  ) {
    nextStatus =
      OrderStatus.SHIPPING;

    actionLabel =
      "Tandai Dikirim";

    ActionIcon =
      Truck;
  }

  if (
    status ===
    OrderStatus.SHIPPING
  ) {
    nextStatus =
      OrderStatus.COMPLETED;

    actionLabel =
      "Selesaikan Order";

    ActionIcon =
      CheckCircle2;
  }

  function updateStatus(
    targetStatus: OrderStatus
  ) {
    setError("");
    setSuccess("");

    startTransition(
      async () => {
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

        window.location.reload();
      }
    );
  }

  function handleNext() {
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

    updateStatus(
      nextStatus
    );
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

  startTransition(
    async () => {
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

      window.location.reload();
    }
  );
}

  return (
    <section className="rounded-xl border bg-background">
      {/* HEADER */}

      <div className="border-b px-6 py-4">
        <h2 className="font-semibold">
          Kontrol Status Order
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Kelola lifecycle order sesuai proses operasional.
        </p>
      </div>

      <div className="space-y-5 p-6">
        {/* CURRENT STATUS */}

        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">
                Status Saat Ini
              </p>

              <p className="mt-1 text-lg font-semibold">
                {getStatusLabel(
                  status
                )}
              </p>
            </div>

            <div className="rounded-full border px-3 py-1 text-xs font-medium">
              {paymentVerified
                ? "Payment Verified"
                : "Payment Belum Verified"}
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

        {/* TERMINAL */}

        {isTerminal ? (
          <div className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
            {status ===
            OrderStatus.COMPLETED
              ? "Order sudah selesai dan merupakan status final."
              : "Order sudah dibatalkan dan tidak dapat diproses kembali."}
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* NEXT */}

            {nextStatus && (
              <Button
                type="button"
                onClick={
                  handleNext
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
                    <ActionIcon className="mr-2 h-4 w-4" />
                    {actionLabel}
                  </>
                )}
              </Button>
            )}

            {/* CANCEL */}

            <Button
              type="button"
              variant="outline"
              onClick={
                handleCancel
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
                  Batalkan Order
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}