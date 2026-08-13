"use client";

import { useTransition } from "react";

import { RotateCcw } from "lucide-react";

import { restoreCustomerAction } from "@/actions/customer/restore-customer";

import { Button } from "@/components/ui/button";

interface RestoreCustomerButtonProps {
  id: string;
  name: string;
}

export default function RestoreCustomerButton({
  id,
  name,
}: RestoreCustomerButtonProps) {
  const [isPending, startTransition] =
    useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result =
            await restoreCustomerAction(id);

          if (!result.success) {
            alert(result.message);
            return;
          }
        })
      }
    >
      <RotateCcw className="mr-2 h-4 w-4" />

      {isPending
        ? "Memulihkan..."
        : "Restore"}
    </Button>
  );
}