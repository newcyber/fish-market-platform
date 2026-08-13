"use server";

import { revalidatePath } from "next/cache";

import UserService from "@/services/user/user.service";

export async function activateUserAction(
  id: string
) {
  const user =
    await UserService.activate(id);

  revalidatePath(
    "/admin/users"
  );

  return user;
}