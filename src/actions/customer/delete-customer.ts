"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/types/action-result";

import CustomerService from "@/services/customer/customer.service";

export async function deleteCustomerAction(
  id: string
): Promise<ActionResult> {
  try {
    await CustomerService.deleteCustomer(id);

    revalidatePath("/admin/customers");

    return {
      success: true,
      message: "Customer berhasil dihapus.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan.",
    };
  }
}