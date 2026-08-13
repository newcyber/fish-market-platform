"use client";

import {
  useTransition,
} from "react";

import {
  AlertTriangle,
  Trash2,
} from "lucide-react";

import {
  forceDeleteOrderAction,
} from "@/actions/order/order-trash";

import {
  Button,
} from "@/components/ui/button";

interface ForceDeleteOrderButtonProps {
  id: string;
  orderNumber: string;
}

export default function ForceDeleteOrderButton({
  id,
  orderNumber,
}: ForceDeleteOrderButtonProps) {
  const [
    isPending,
    startTransition,
  ] = useTransition();

  function handleForceDelete() {
    const confirmed =
      window.confirm(
        `Hapus permanen order ${orderNumber}?\n\nData yang dihapus tidak dapat dipulihkan kembali.`
      );

    if (!confirmed) {
      return;
    }

    startTransition(
      async () => {
        const result =
          await forceDeleteOrderAction(
            id
          );

        if (!result.success) {
          window.alert(
            result.message ??
              "Gagal menghapus order secara permanen."
          );

          return;
        }

        window.location.reload();
      }
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      disabled={isPending}
      onClick={
        handleForceDelete
      }
    >
      {isPending ? (
        <>
          <AlertTriangle className="mr-2 h-4 w-4 animate-pulse" />
          Menghapus...
        </>
      ) : (
        <>
          <Trash2 className="mr-2 h-4 w-4" />
          Hapus Permanen
        </>
      )}
    </Button>
  );
}