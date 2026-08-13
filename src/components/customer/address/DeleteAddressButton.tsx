"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  Loader2,
  Trash2,
} from "lucide-react";

import {
  deleteAddressAction,
} from "@/actions/address/delete-address";

interface DeleteAddressButtonProps {
  addressId: string;
}

export default function DeleteAddressButton({
  addressId,
}: DeleteAddressButtonProps) {
  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    message,
    setMessage,
  ] = useState<string | null>(
    null
  );

  function handleDelete() {
    const confirmed =
      window.confirm(
        "Apakah Anda yakin ingin menghapus alamat ini?"
      );

    if (!confirmed) {
      return;
    }

    setMessage(null);

    startTransition(
      async () => {
        const result =
          await deleteAddressAction(
            addressId
          );

        setMessage(
          result.message
        );

        if (result.success) {
          window.location.reload();
        }
      }
    );
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center gap-2 text-sm font-medium text-destructive transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />

            Menghapus...
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4" />

            Hapus
          </>
        )}
      </button>

      {message && (
        <p className="mt-2 max-w-[220px] text-right text-xs text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}