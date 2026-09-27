"use server";

import {
  auth,
} from "@/auth";

import UserService from "@/services/user/user.service";

import {
  updateProfileSchema,
} from "@/validators/users/update-profile.validator";

export type UpdateProfileActionResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
    };

export async function updateAdminProfileAction(
  formData: FormData
): Promise<UpdateProfileActionResult> {
  try {
    const session =
      await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Sesi Anda sudah berakhir. Silakan login kembali.",
      };
    }

    const rawData = {
      name: String(
        formData.get("name") ?? ""
      ),

      phone: String(
        formData.get("phone") ?? ""
      ),
    };

    const parsed =
      updateProfileSchema.safeParse(
        rawData
      );

    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ??
        "Data profile tidak valid.";

      return {
        success: false,
        message: firstError,
      };
    }

    await UserService.updateOwnProfile(
      session.user.id,
      parsed.data
    );

    return {
      success: true,
      message: "Profile berhasil diperbarui.",
    };
  } catch (error) {
    console.error(
      "[updateAdminProfileAction]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui profile.",
    };
  }
}