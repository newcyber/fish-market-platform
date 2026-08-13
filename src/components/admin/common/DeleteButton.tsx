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

interface DeleteButtonProps {
  title?: string;

  description?: string;

  confirmLabel?: string;

  cancelLabel?: string;

  onDelete: () => Promise<void>;
}

export default function DeleteButton({
  title = "Hapus Data",
  description = "Data yang sudah dihapus tidak dapat dikembalikan.",
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  onDelete,
}: DeleteButtonProps) {
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
            onClick={(event) => {
              event.preventDefault();

              startTransition(async () => {
                await onDelete();
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