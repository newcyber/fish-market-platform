
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FlashSaleRowActionsProps {
  flashSaleId: string;
  flashSaleName: string;
}

export function FlashSaleRowActions({
  flashSaleId,
  flashSaleName,
}: FlashSaleRowActionsProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/flash-sales/${encodeURIComponent(flashSaleId)}`,
        {
          method: "DELETE",
          headers: { Accept: "application/json" },
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok || result?.success !== true) {
        throw new Error(
          result?.message ?? "Gagal menghapus Flash Sale.",
        );
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menghapus Flash Sale.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Aksi untuk ${flashSaleName}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Buka menu</span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              router.push(`/admin/flash-sales/${flashSaleId}`);
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            Lihat Detail
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              router.push(`/admin/flash-sales/${flashSaleId}/edit`);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Flash Sale
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              setError(null);
              setIsOpen(true);
            }}
            className="text-red-600 focus:bg-red-50 focus:text-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus Flash Sale
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-flash-sale-${flashSaleId}`}
          >
            <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
              <h2
                id={`delete-flash-sale-${flashSaleId}`}
                className="text-lg font-semibold"
              >
                Hapus Flash Sale?
              </h2>

              <p className="mt-3 text-sm text-muted-foreground">
                Anda yakin ingin menghapus campaign{" "}
                <strong className="text-foreground">
                  {flashSaleName}
                </strong>
                ?
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Campaign akan dihapus dari pengelolaan Flash Sale.
                Data transaksi historis tetap dipertahankan.
              </p>

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
