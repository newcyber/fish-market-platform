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
  deleteProductImageAction,
} from "@/actions/product/delete-product-image";

interface DeleteImageButtonProps {
  imageId: string;

  productId: string;
}

export default function DeleteImageButton({
  imageId,
  productId,
}: DeleteImageButtonProps) {
  const [open, setOpen] =
    useState(false);

  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
    >
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="destructive"
            className="w-full"
          />
        }
      >
        <Trash2 className="mr-2 h-4 w-4" />

        Hapus
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Hapus Gambar
          </AlertDialogTitle>

          <AlertDialogDescription>
            Apakah Anda yakin ingin
            menghapus gambar ini?
            <br />
            <br />
            Gambar akan dihapus dari
            database beserta file
            penyimpanannya.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form
          action={deleteProductImageAction}
        >
          <input
            type="hidden"
            name="imageId"
            value={imageId}
          />

          <input
            type="hidden"
            name="productId"
            value={productId}
          />

          <AlertDialogFooter>
            <AlertDialogCancel>
              Batal
            </AlertDialogCancel>

            <AlertDialogAction
              type="submit"
              variant="destructive"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}