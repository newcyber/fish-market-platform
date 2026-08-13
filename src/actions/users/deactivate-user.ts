"use server";

import { revalidatePath } from "next/cache";

import UserService from "@/services/user/user.service";

export async function deactivateUserAction(
  id: string
) {
  const user =
    await UserService.deactivate(
      id
    );

  revalidatePath(
    "/admin/users"
  );

  return user;
}