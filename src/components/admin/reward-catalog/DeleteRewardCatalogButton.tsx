"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

/**
 * ============================================================
 * DELETE REWARD CATALOG BUTTON
 * ============================================================
 *
 * Tanggung jawab:
 *
 * - meminta konfirmasi admin
 * - memanggil DELETE API
 * - menampilkan loading
 * - menampilkan error
 * - refresh halaman setelah berhasil
 *
 * Business rule tetap berada di server.
 *
 * Client TIDAK menentukan apakah reward boleh dihapus.
 *
 * Server tetap melakukan pengecekan RewardClaim.
 * ============================================================
 */

type DeleteRewardCatalogButtonProps = {
  rewardId: string;

  rewardName: string;
};

export function DeleteRewardCatalogButton({
  rewardId,
  rewardName,
}: DeleteRewardCatalogButtonProps) {
  const router =
    useRouter();

  const [
    isOpen,
    setIsOpen,
  ] =
    useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  /**
   * ----------------------------------------------------------
   * OPEN CONFIRMATION
   * ----------------------------------------------------------
   */

  function openDialog() {
    if (isDeleting) {
      return;
    }

    setError(null);
    setIsOpen(true);
  }

  /**
   * ----------------------------------------------------------
   * CLOSE CONFIRMATION
   * ----------------------------------------------------------
   */

  function closeDialog() {
    if (isDeleting) {
      return;
    }

    setIsOpen(false);
    setError(null);
  }

  /**
   * ----------------------------------------------------------
   * DELETE
   * ----------------------------------------------------------
   */

  async function handleDelete() {
    if (isDeleting) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      const response =
        await fetch(
          `/api/admin/reward-catalog/${rewardId}`,
          {
            method: "DELETE",
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ??
            "Gagal menghapus reward."
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
          : "Gagal menghapus reward."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <>
      {/* ======================================================
          DELETE BUTTON
      ====================================================== */}

      <button
        type="button"
        onClick={
          openDialog
        }
        disabled={
          isDeleting
        }
        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Hapus
      </button>

      {/* ======================================================
          CONFIRMATION DIALOG
      ====================================================== */}

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-reward-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-xl">
            {/* ==================================================
                DIALOG CONTENT
            ================================================== */}

            <div className="min-w-0">
              <h2
                id="delete-reward-title"
                className="text-lg font-semibold text-gray-900"
              >
                Hapus Reward?
              </h2>

              <p className="mt-2 max-w-full whitespace-normal wrap-break-word text-sm leading-6 text-gray-600">
                Anda akan menghapus reward{" "}
                <span className="font-semibold text-gray-900">
                  &quot;{rewardName}&quot;
                </span>
                .
              </p>

              <p className="mt-2 max-w-full whitespace-normal wrap-break-word text-sm leading-6 text-gray-500">
                Tindakan ini permanen. Reward
                yang sudah memiliki histori
                penukaran tidak dapat dihapus.
              </p>
            </div>

            {/* ==================================================
                ERROR
            ================================================== */}

            {error ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="wrap-break-word text-sm font-medium text-red-700">
                  {error}
                </p>
              </div>
            ) : null}

            {/* ==================================================
                ACTIONS
            ================================================== */}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  closeDialog
                }
                disabled={
                  isDeleting
                }
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={
                  handleDelete
                }
                disabled={
                  isDeleting
                }
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

export default DeleteRewardCatalogButton;
