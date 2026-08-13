"use client";

import DeleteButton from "@/components/admin/common/DeleteButton";

import { forceDeleteCustomerAction } from "@/actions/customer/force-delete-customer";

interface ForceDeleteCustomerButtonProps {
  id: string;
  name: string;
}

export default function ForceDeleteCustomerButton({
  id,
  name,
}: ForceDeleteCustomerButtonProps) {
  return (
    <DeleteButton
      title="Hapus Permanen"
      description={`Customer "${name}" akan dihapus permanen dan tidak dapat dipulihkan lagi.`}
      confirmLabel="Hapus Permanen"
      cancelLabel="Batal"
      onDelete={async () => {
        const result =
          await forceDeleteCustomerAction(id);

        if (!result.success) {
          throw new Error(result.message);
        }
      }}
    />
  );
}