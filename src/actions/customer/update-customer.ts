"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/types/action-result";

import CustomerService from "@/services/customer/customer.service";

import {
  updateCustomerSchema,
} from "@/validators/customers/update-customer.validator";

export async function updateCustomerAction(
  id: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed =
    updateCustomerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      phone: formData.get("phone"),
      role: formData.get("role"),
      isActive: formData.get("isActive"),
    });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validasi gagal.",
      errors:
        parsed.error.flatten().fieldErrors,
    };
  }

  try {
  await CustomerService.updateCustomer(
    id,
    parsed.data
  );

  revalidatePath("/admin/customers");

  revalidatePath(
    `/admin/customers/${id}/edit`
  );
} catch (error) {
  return {
    success: false,
    message:
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan.",
  };
}

redirect("/admin/customers");
}