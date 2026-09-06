"use server";

import { revalidatePath } from "next/cache";

import CustomerService from "@/services/customer/customer.service";
import { requireAdmin } from "@/lib/auth/admin";

export async function activateCustomerAction(
  id: string
) {
  await requireAdmin();
  if (!id || !id.trim()) {
    throw new Error("Customer ID tidak valid.");
  }

  const customer =
    await CustomerService.getCustomerById(id);

  if (!customer) {
    throw new Error("Customer tidak ditemukan.");
  }

  if (customer.isActive) {
    return {
      success: true,
      message: "Customer sudah aktif.",
    };
  }

  await CustomerService.updateCustomer(id, {
    isActive: true,
  });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${id}`);

  return {
    success: true,
    message: "Customer berhasil diaktifkan kembali.",
  };
}
