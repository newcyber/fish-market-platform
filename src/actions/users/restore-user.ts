"use server";

import { revalidatePath } from "next/cache";

import UserService from "@/services/user/user.service";

export async function restoreUserAction(
  id: string
) {
  const user =
    await UserService.restore(id);

  revalidatePath(
    "/admin/users"
  );

  return user;
}