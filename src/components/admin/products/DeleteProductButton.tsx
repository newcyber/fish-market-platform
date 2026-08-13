"use client";

import { useState } from "react";

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

import {
  deleteProductAction,
} from "@/actions/product/delete-product";

interface DeleteProductButtonProps {
  id: string;
  name: string;
}

export default function DeleteProductButton({
  id,
  name,
}: DeleteProductButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
    >
      <AlertDialogTrigger
  render={
    <Button
      variant="destructive"
      size="icon"
      type="button"
    />
  }
>
  <Trash2 className="h-4 w-4" />
</AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Hapus Produk
          </AlertDialogTitle>

          <AlertDialogDescription>
            Apakah Anda yakin ingin
            menghapus produk{" "}
            <strong>
              {`"${name}"`}
            </strong>
            ?
            <br />
            <br />
            Produk akan di-soft delete
            dan masih dapat dipulihkan
            kembali.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>
            Batal
          </AlertDialogCancel>

          <form
            action={deleteProductAction}
          >
            <input
              type="hidden"
              name="id"
              value={id}
            />

            <AlertDialogAction
              type="submit"
              variant="destructive"
            >
              Ya, Hapus
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}