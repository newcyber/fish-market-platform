"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { activateCustomerAction } from "@/actions/customer/activate-customer";

interface ActivateCustomerButtonProps {
  customerId: string;
}

export default function ActivateCustomerButton({
  customerId,
}: ActivateCustomerButtonProps) {
  const [isPending, startTransition] =
    useTransition();

  const [error, setError] =
    useState<string | null>(null);

  function handleActivate() {
    const confirmed = window.confirm(
      "Aktifkan kembali customer ini?\n\nCustomer akan dapat menggunakan akun kembali."
    );

    if (!confirmed) {
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        await activateCustomerAction(
          customerId
        );

        window.location.reload();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengaktifkan customer."
        );
      }
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <button
        type="button"
        onClick={handleActivate}
        disabled={isPending}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <Loader2
            className="h-4 w-4 animate-spin"
          />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}

        {isPending
          ? "Memproses..."
          : "Aktifkan Kembali"}
      </button>

      {error && (
        <p className="max-w-[220px] text-right text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
