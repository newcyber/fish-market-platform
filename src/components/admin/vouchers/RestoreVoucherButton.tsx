"use client";

import {
  type MouseEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type RestoreVoucherButtonProps = {
  voucherId: string;
  voucherCode: string;
  usageCount: number;
};

export function RestoreVoucherButton({
  voucherId,
  voucherCode,
  usageCount,
}: RestoreVoucherButtonProps) {
  const router =
    useRouter();

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    isRestoring,
    setIsRestoring,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const isUsed =
    usageCount > 0;

  function openDialog(
    event?: MouseEvent<HTMLButtonElement>
  ) {
    event?.preventDefault();
    event?.stopPropagation();

    if (
      isRestoring ||
      isUsed
    ) {
      return;
    }

    setError(null);
    setIsOpen(true);
  }

  function closeDialog(
    event?: MouseEvent<HTMLButtonElement>
  ) {
    event?.preventDefault();
    event?.stopPropagation();

    if (isRestoring) {
      return;
    }

    setIsOpen(false);
    setError(null);
  }

  async function handleRestore(
    event?: MouseEvent<HTMLButtonElement>
  ) {
    event?.preventDefault();
    event?.stopPropagation();

    if (
      isRestoring ||
      isUsed
    ) {
      return;
    }

    setError(null);
    setIsRestoring(true);

    try {
      const response =
        await fetch(
          `/api/admin/vouchers/${voucherId}/restore`,
          {
            method: "POST",
            headers: {
              Accept:
                "application/json",
            },
          }
        );

      const payload =
        await response
          .json()
          .catch(() => null);

      if (
        !response.ok ||
        !payload?.success
      ) {
        throw new Error(
          payload?.message ??
            "Voucher gagal dipulihkan."
        );
      }

      setIsOpen(false);
      router.refresh();
    } catch (
      restoreError
    ) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "Voucher gagal dipulihkan."
      );
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        disabled={
          isRestoring ||
          isUsed
        }
        title={
          isUsed
            ? "Voucher yang sudah digunakan tidak dapat dipulihkan."
            : `Pulihkan ${voucherCode}`
        }
        className="rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Pulihkan
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`restore-voucher-title-${voucherId}`}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2
              id={`restore-voucher-title-${voucherId}`}
              className="text-lg font-semibold text-gray-900"
            >
              Pulihkan voucher?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Voucher{" "}
              <span className="font-semibold text-gray-900">
                {voucherCode}
              </span>{" "}
              akan dikembalikan ke daftar voucher.
            </p>

            <p className="mt-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs leading-5 text-yellow-800">
              Voucher akan dipulihkan sebagai nonaktif.
              Aktifkan kembali secara manual jika voucher
              sudah siap digunakan oleh customer.
            </p>

            {error ? (
              <div
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDialog}
                disabled={isRestoring}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleRestore}
                disabled={
                  isRestoring ||
                  isUsed
                }
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRestoring
                  ? "Memulihkan..."
                  : "Ya, Pulihkan"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}