import { notFound } from "next/navigation";

import CustomerForm from "@/components/admin/customers/CustomerForm";

import CustomerService from "@/services/customer/customer.service";

import {
  updateCustomerAction,
} from "@/actions/customer/update-customer";

export const dynamic = "force-dynamic";

interface EditCustomerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCustomerPage({
  params,
}: EditCustomerPageProps) {
  const { id } = await params;

  const customer =
    await CustomerService.getCustomerById(
      id
    );

  if (!customer) {
    notFound();
  }

  async function action(
    formData: FormData
  ) {
    "use server";

    await updateCustomerAction(
      id,
      {
        success: false,
      },
      formData
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Edit Customer
        </h1>

        <p className="text-muted-foreground">
          Perbarui informasi customer.
        </p>
      </div>

      <CustomerForm
        submitLabel="Update Customer"
        action={action}
        defaultValues={{
          name: customer.name,
          email: customer.email,
          phone: customer.phone ?? "",
          role: customer.role,
          isActive:
            customer.isActive,
        }}
      />
    </div>
  );
}