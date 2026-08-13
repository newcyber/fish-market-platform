import { redirect } from "next/navigation";

import CustomerForm from "@/components/admin/customers/CustomerForm";

import {
  createCustomerAction,
} from "@/actions/customer/create-customer";

export const dynamic = "force-dynamic";

export default async function CreateCustomerPage() {
  async function action(
    formData: FormData
  ) {
    "use server";

    const result =
      await createCustomerAction(
        null,
        formData
      );

    if (!result.success) {
      console.error(result);
      return;
    }

    redirect("/admin/customers");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Tambah Customer
        </h1>

        <p className="text-muted-foreground">
          Tambahkan customer baru
          ke sistem.
        </p>
      </div>

      <CustomerForm
        action={action}
      />
    </div>
  );
}