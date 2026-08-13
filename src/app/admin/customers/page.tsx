import CustomerToolbar from "@/components/admin/customers/CustomerToolbar";

import CustomerTable from "@/components/admin/customers/CustomerTable";

import CustomerService from "@/services/customer/customer.service";
import { Role } from "@prisma/client";

interface CustomersPageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    status?: string;
  }>;
}

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const params = await searchParams;

  const customers =
  await CustomerService.getCustomers({
    search: params.search,

    role:
      params.role &&
      params.role !== "all"
        ? (params.role as Role)
        : undefined,

    isActive:
      params.status === "active"
        ? true
        : params.status ===
            "inactive"
          ? false
          : undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Customer
        </h1>

        <p className="text-muted-foreground">
          Kelola seluruh customer
          yang terdaftar pada sistem.
        </p>
      </div>

      <CustomerToolbar
        search={params.search}
        role={params.role}
        status={params.status}
      />

      <CustomerTable
  customers={customers}
/>
    </div>
  );
}