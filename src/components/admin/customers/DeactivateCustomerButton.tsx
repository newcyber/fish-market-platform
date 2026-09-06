"use client";

import { useState, useTransition } from "react";
import { Loader2, Power } from "lucide-react";

import { deactivateCustomerAction } from "@/actions/customer/deactivate-customer";

interface DeactivateCustomerButtonProps {
  customerId: string;
}

export default function DeactivateCustomerButton({
  customerId,
}: DeactivateCustomerButtonProps) {
  const [isPending, startTransition] =
    useTransition();

  const [error, setError] =
    useState<string | null>(null);

  function handleDeactivate() {
    const confirmed = window.confirm(
      "Nonaktifkan customer ini?\n\nCustomer tidak akan dapat menggunakan akun sampai diaktifkan kembali."
    );

    if (!confirmed) {
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        await deactivateCustomerAction(
          customerId
        );

        window.location.reload();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal menonaktifkan customer."
        );
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDeactivate}
        disabled={isPending}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <Loader2
            size={16}
            className="animate-spin"
          />
        ) : (
          <Power size={16} />
        )}

        {isPending
          ? "Memproses..."
          : "Nonaktifkan"}
      </button>

      {error && (
        <p className="max-w-[220px] text-right text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
