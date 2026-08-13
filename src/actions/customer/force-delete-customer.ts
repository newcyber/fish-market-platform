"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/types/action-result";

import CustomerService from "@/services/customer/customer.service";

export async function forceDeleteCustomerAction(
  id: string
): Promise<ActionResult> {
  try {
    await CustomerService.forceDeleteCustomer(id);

    revalidatePath("/admin/customers");
    revalidatePath("/admin/customers/trash");

    return {
      success: true,
      message: "Customer berhasil dihapus permanen.",
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