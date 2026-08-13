import AdminDataTable from "@/components/admin/common/AdminDataTable";
import AdminStatusBadge from "@/components/admin/common/AdminStatusBadge";

import RestoreCustomerButton from "./RestoreCustomerButton";
import ForceDeleteCustomerButton from "./ForceDeleteCustomerButton";

interface Customer {
  id: string;

  name: string;

  email: string;

  phone: string | null;

  role: string;

  isActive: boolean;

  deletedAt: Date | null;
}

interface CustomerTrashTableProps {
  customers: Customer[];
}

export default function CustomerTrashTable({
  customers,
}: CustomerTrashTableProps) {
  return (
    <AdminDataTable
      headers={[
        "Nama",
        "Email",
        "Role",
        "Status",
        "Dihapus",
        "Aksi",
      ]}
    >
      {customers.length === 0 ? (
        <tr>
          <td
            colSpan={6}
            className="py-10 text-center text-muted-foreground"
          >
            Tidak ada customer di Trash.
          </td>
        </tr>
      ) : (
        customers.map((customer) => (
          <tr
            key={customer.id}
            className="border-b"
          >
            <td className="px-6 py-4 font-medium">
              {customer.name}
            </td>

            <td className="px-6 py-4">
              {customer.email}
            </td>

            <td className="px-6 py-4">
              {customer.role}
            </td>

            <td className="px-6 py-4">
              <AdminStatusBadge
                active={customer.isActive}
              />
            </td>

            <td className="px-6 py-4">
              {customer.deletedAt
                ? customer.deletedAt.toLocaleString(
                    "id-ID"
                  )
                : "-"}
            </td>

            <td className="px-6 py-4">
              <div className="flex gap-2">
                <RestoreCustomerButton
                  id={customer.id}
                  name={customer.name}
                />

                <ForceDeleteCustomerButton
                  id={customer.id}
                  name={customer.name}
                />
              </div>
            </td>
          </tr>
        ))
      )}
    </AdminDataTable>
  );
}