"use client";

import { useTransition } from "react";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteDialogProps {
  title?: string;

  description?: string;

  confirmLabel?: string;

  cancelLabel?: string;

  onConfirm: () => Promise<void>;
}

export default function DeleteDialog({
  title = "Hapus Data",
  description = "Data yang dihapus tidak dapat dikembalikan.",
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  onConfirm,
}: DeleteDialogProps) {
  const [isPending, startTransition] =
    useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            size="sm"
            variant="destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </Button>
        }
      />

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {title}
          </AlertDialogTitle>

          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>
            {cancelLabel}
          </AlertDialogCancel>

          <AlertDialogAction
            disabled={isPending}
            onClick={async (
              event
            ) => {
              event.preventDefault();

              startTransition(async () => {
                await onConfirm();
              });
            }}
          >
            {isPending
              ? "Menghapus..."
              : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}