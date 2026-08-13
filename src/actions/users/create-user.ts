"use server";

import { revalidatePath } from "next/cache";

import UserService from "@/services/user/user.service";

import {
  userSchema,
} from "@/validators/users/create-user.validator";

export async function createUserAction(
  data: unknown
) {
  const input =
    userSchema.parse(data);

  const user =
    await UserService.createAdmin(
      input
    );

  revalidatePath(
    "/admin/users"
  );

  return user;
}