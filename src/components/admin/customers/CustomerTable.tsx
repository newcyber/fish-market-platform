import Link from "next/link";

import AdminDataTable from "@/components/admin/common/AdminDataTable";
import AdminStatusBadge from "@/components/admin/common/AdminStatusBadge";
import DeleteCustomerButton from "./DeleteCustomerButton";

import { Button } from "@/components/ui/button";

interface Customer {
  id: string;

  name: string;

  email: string;

  phone: string | null;

  role: string;

  isActive: boolean;

  createdAt: Date;
}

interface CustomerTableProps {
  customers: Customer[];

  mode?: "active" | "trash";
}

export default function CustomerTable({
  customers,
  mode = "active",
}: CustomerTableProps) {
  return (
    <AdminDataTable
      headers={[
        "Nama",
        "Email",
        "Telepon",
        "Role",
        "Status",
        "Aksi",
      ]}
    >
      {customers.length === 0 ? (
        <tr>
          <td
            colSpan={6}
            className="py-10 text-center text-muted-foreground"
          >
            Belum ada customer.
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
              {customer.phone ?? "-"}
            </td>

            <td className="px-6 py-4">
              {customer.role}
            </td>

            <td className="px-6 py-4">
              <AdminStatusBadge
                active={
                  customer.isActive
                }
              />
            </td>

            <td className="px-6 py-4">
              <div className="flex gap-2">
                <Link href={`/admin/customers/${customer.id}/edit`}>
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    Edit
                  </Button>
                </Link>

                <DeleteCustomerButton
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