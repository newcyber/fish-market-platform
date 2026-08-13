"use server";

import { revalidatePath } from "next/cache";

import UserService from "@/services/user/user.service";

import {
  updateUserSchema,
} from "@/validators/users/update-user.validator";

export async function updateUserAction(
  id: string,
  data: unknown
) {
  const input =
    updateUserSchema.parse(
      data
    );

  const user =
    await UserService.updateAdmin(
      id,
      input
    );

  revalidatePath(
    "/admin/users"
  );

  return user;
}