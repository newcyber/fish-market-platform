"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { Prisma } from "@prisma/client";

import type { ActionResult } from "@/types/action-result";

import CustomerService from "@/services/customer/customer.service";

import {
  createCustomerSchema,
} from "@/validators/customers/create-customer.validator";

export async function createCustomerAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed =
    createCustomerSchema.safeParse({
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
  await CustomerService.createCustomer(
    parsed.data
  );

  revalidatePath(
    "/admin/customers"
  );
} catch (error) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = error.meta?.target as string[] | undefined;

    if (target?.includes("email")) {
      return {
        success: false,
        message: "Email sudah digunakan.",
      };
    }

    if (target?.includes("phone")) {
      return {
        success: false,
        message: "Nomor telepon sudah digunakan.",
      };
    }

    return {
      success: false,
      message: "Data sudah digunakan.",
    };
  }

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