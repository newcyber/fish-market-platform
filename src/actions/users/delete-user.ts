"use server";

import { revalidatePath } from "next/cache";

import UserService from "@/services/user/user.service";

export async function deleteUserAction(
  id: string
) {
  const user =
    await UserService.delete(id);

  revalidatePath(
    "/admin/users"
  );

  return user;
}