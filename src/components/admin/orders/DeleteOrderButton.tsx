"use client";

import { useTransition } from "react";

import {
  Trash2,
} from "lucide-react";

import deleteOrderAction from "@/actions/order/delete-order";

import {
  Button,
} from "@/components/ui/button";

interface DeleteOrderButtonProps {
  id: string;
  orderNumber: string;
}

export default function DeleteOrderButton({
  id,
  orderNumber,
}: DeleteOrderButtonProps) {
  const [
    isPending,
    startTransition,
  ] = useTransition();

  function handleDelete() {
    const confirmed =
      window.confirm(
        `Pindahkan order ${orderNumber} ke Trash?\n\nOrder tidak akan dihapus permanen dan masih dapat dipulihkan.`
      );

    if (!confirmed) {
      return;
    }

    startTransition(
      async () => {
        const result =
          await deleteOrderAction(id);

        if (!result.success) {
          window.alert(
            result.message ??
              "Gagal memindahkan order ke Trash."
          );

          return;
        }

        window.location.href =
          "/admin/orders";
      }
    );
  }

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={isPending}
      onClick={handleDelete}
    >
      <Trash2 className="mr-2 h-4 w-4" />

      {isPending
        ? "Memindahkan..."
        : "Delete Order"}
    </Button>
  );
}