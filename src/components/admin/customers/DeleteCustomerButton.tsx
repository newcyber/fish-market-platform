"use client";

import { useTransition } from "react";

import { useRouter } from "next/navigation";

import DeleteDialog from "@/components/admin/common/DeleteDialog";

import { deleteCustomerAction } from "@/actions/customer/delete-customer";

interface DeleteCustomerButtonProps {
  id: string;
  name: string;
}

export default function DeleteCustomerButton({
  id,
  name,
}: DeleteCustomerButtonProps) {
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  async function handleDelete() {
    startTransition(async () => {
      const result =
        await deleteCustomerAction(id);

      if (!result.success) {
        console.error(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <DeleteDialog
      title="Hapus Customer"
      description={`Apakah Anda yakin ingin menghapus customer "${name}"?`}
      confirmLabel={
        isPending
          ? "Menghapus..."
          : "Hapus"
      }
      onConfirm={handleDelete}
    />
  );
}