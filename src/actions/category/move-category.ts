"use server";

import { revalidatePath } from "next/cache";
import CategoryRepository from "@/repositories/CategoryRepository";

export async function moveCategoryAction(
  id: string,
  direction: "up" | "down",
): Promise<{ success: boolean; message: string }> {
  if (!id || !["up", "down"].includes(direction)) {
    throw new Error("Parameter perpindahan kategori tidak valid.");
  }

  const result = await CategoryRepository.move(id, direction);

  revalidatePath("/admin/categories");

  return {
    success: true,
    message:
      direction === "up"
        ? `Kategori berhasil dipindahkan ke atas.`
        : `Kategori berhasil dipindahkan ke bawah.`,
  };
}
