"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restore = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/vouchers/${voucherId}/restore`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.message || "Voucher gagal dipulihkan."
        );
      }

      setOpen(false);
      router.refresh();
    } catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "Voucher gagal dipulihkan."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        disabled={usageCount > 0}
        className="rounded-lg border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
        title={
          usageCount > 0
            ? "Voucher yang sudah digunakan tidak dapat dipulihkan."
            : `Pulihkan ${voucherCode}`
        }
      >
        Pulihkan
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Pulihkan Voucher?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Voucher <span className="font-semibold text-gray-900">{voucherCode}</span> akan dikembalikan ke daftar aktif/nonaktif berdasarkan status terakhirnya.
            </p>

            <p className="mt-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs leading-5 text-yellow-800">
              Setelah dipulihkan, periksa kembali periode dan status voucher sebelum mengaktifkannya untuk customer.
            </p>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={restore}
                disabled={loading}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Memulihkan..." : "Ya, Pulihkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
