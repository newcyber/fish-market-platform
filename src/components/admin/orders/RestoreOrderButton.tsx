"use client";

import {
  useTransition,
} from "react";

import {
  RotateCcw,
} from "lucide-react";

import {
  restoreOrderAction,
} from "@/actions/order/order-trash";

import {
  Button,
} from "@/components/ui/button";

interface RestoreOrderButtonProps {
  id: string;
}

export default function RestoreOrderButton({
  id,
}: RestoreOrderButtonProps) {
  const [
    isPending,
    startTransition,
  ] = useTransition();

  function handleRestore() {
    startTransition(
      async () => {
        const result =
          await restoreOrderAction(
            id
          );

        if (!result.success) {
          window.alert(
            result.message ??
              "Gagal memulihkan order."
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
      variant="outline"
      disabled={isPending}
      onClick={
        handleRestore
      }
    >
      <RotateCcw className="mr-2 h-4 w-4" />

      {isPending
        ? "Memulihkan..."
        : "Restore"}
    </Button>
  );
}