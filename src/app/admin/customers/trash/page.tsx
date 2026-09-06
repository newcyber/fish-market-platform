import CustomerService from "@/services/customer/customer.service";

import CustomerTrashTable from "@/components/admin/customers/CustomerTrashTable";
import { requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function CustomerTrashPage() {
  await requireAdmin();

  const customers =
    await CustomerService.getDeletedCustomers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Customer Trash
        </h1>

        <p className="text-muted-foreground">
          Daftar customer yang telah dihapus.
        </p>
      </div>

      <CustomerTrashTable
  customers={customers}
/>
    </div>
  );
}
