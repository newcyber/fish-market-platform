"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

/**
 * ============================================================
 * DELETE VOUCHER BUTTON
 * ============================================================
 *
 * Tanggung jawab:
 * - meminta konfirmasi admin
 * - memanggil DELETE API
 * - menampilkan loading state
 * - menampilkan error dari server
 * - refresh daftar voucher setelah berhasil
 *
 * Business rule tetap berada di server.
 * Client hanya memberi UX tambahan berdasarkan usageCount.
 */

type DeleteVoucherButtonProps = {
  voucherId: string;

  voucherCode: string;

  usageCount: number;
};

export function DeleteVoucherButton({
  voucherId,
  voucherCode,
  usageCount,
}: DeleteVoucherButtonProps) {
  const router =
    useRouter();

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const isUsed =
    usageCount > 0;

  function openDialog() {
    if (
      isDeleting ||
      isUsed
    ) {
      return;
    }

    setError(null);
    setIsOpen(true);
  }

  function closeDialog() {
    if (isDeleting) {
      return;
    }

    setIsOpen(false);
    setError(null);
  }

  async function handleDelete() {
    if (isDeleting) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      const response =
        await fetch(
          `/api/admin/vouchers/${voucherId}`,
          {
            method: "DELETE",
            headers: {
              Accept:
                "application/json",
            },
          }
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ??
            "Gagal menghapus voucher."
        );
      }

      setIsOpen(false);
      router.refresh();
    } catch (
      deleteError
    ) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Gagal menghapus voucher."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        disabled={
          isDeleting ||
          isUsed
        }
        title={
          isUsed
            ? "Voucher yang sudah digunakan tidak dapat dihapus"
            : "Hapus voucher"
        }
        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Hapus
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-voucher-title-${voucherId}`}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2
              id={`delete-voucher-title-${voucherId}`}
              className="text-lg font-semibold text-gray-900"
            >
              Hapus voucher?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Voucher{" "}
              <span className="font-semibold text-gray-900">
                {voucherCode}
              </span>{" "}
              akan dinonaktifkan dan dipindahkan dari daftar voucher aktif.
            </p>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Data tidak dihapus secara fisik agar histori transaksi tetap aman.
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
                disabled={isDeleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting
                  ? "Menghapus..."
                  : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
