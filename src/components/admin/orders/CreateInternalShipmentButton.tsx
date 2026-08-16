"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  Truck,
  Loader2,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  createInternalShipmentAction,
} from "@/app/admin/orders/actions/create-internal-shipment.action";

/**
 * ============================================================
 * CREATE INTERNAL SHIPMENT BUTTON
 * ============================================================
 *
 * Tombol untuk:
 *
 * - Membuat resi Kurir Internal
 * - Mengubah status order menjadi SHIPPING
 * - Mencegah klik berulang
 * - Refresh halaman setelah berhasil
 *
 * ============================================================
 */

interface CreateInternalShipmentButtonProps {
  orderId: string;

  orderNumber: string;
}

export default function CreateInternalShipmentButton({
  orderId,
  orderNumber,
}: CreateInternalShipmentButtonProps) {
  const router =
    useRouter();

  const [isPending, startTransition] =
    useTransition();

  const [message, setMessage] =
    useState<string | null>(null);

  /**
   * ==========================================================
   * HANDLE CREATE SHIPMENT
   * ==========================================================
   */

  function handleCreateShipment() {
    const confirmed =
      window.confirm(
        `Buat resi Kurir Internal untuk pesanan ${orderNumber}?`
      );

    if (!confirmed) {
      return;
    }

    setMessage(null);

    startTransition(
      async () => {
        const result =
          await createInternalShipmentAction(
            orderId
          );

        if (!result.success) {
          setMessage(
            result.message ??
              "Gagal membuat resi Kurir Internal."
          );

          return;
        }

        setMessage(
          result.message ??
            "Resi Kurir Internal berhasil dibuat."
        );

        router.refresh();
      }
    );
  }

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={
          handleCreateShipment
        }
        disabled={
          isPending
        }
        className="
          inline-flex
          items-center
          justify-center
          gap-2
          rounded-md
          bg-blue-600
          px-4
          py-2
          text-sm
          font-medium
          text-white
          transition
          hover:bg-blue-700
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />

            Membuat Resi...
          </>
        ) : (
          <>
            <Truck className="h-4 w-4" />

            Buat Resi Internal
          </>
        )}
      </button>

      {message && (
        <p
          className="
            max-w-xs
            text-right
            text-xs
            text-muted-foreground
          "
        >
          {message}
        </p>
      )}
    </div>
  );
}