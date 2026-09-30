import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/admin";
import { AdminMemberTierService } from "@/services/member-tier/admin-member-tier.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireSuperAdmin();

    const { id } = await context.params;
    const body = await request.json();

    if (typeof body?.isActive !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message: "Status aktif tidak valid.",
        },
        { status: 400 },
      );
    }

    const tier = await AdminMemberTierService.setActive(id, body.isActive);

    return NextResponse.json({
      success: true,
      data: tier,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "Anda harus login." },
        { status: 401 },
      );
    }

    if (message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, message: "Anda tidak memiliki akses." },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: message || "Gagal mengubah status member tier.",
      },
      { status: 400 },
    );
  }
}
