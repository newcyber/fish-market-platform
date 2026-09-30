import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/admin";
import { AdminMemberTierService } from "@/services/member-tier/admin-member-tier.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function authError(error: unknown) {
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

  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireSuperAdmin();

    const { id } = await context.params;
    const tier = await AdminMemberTierService.getById(id);

    return NextResponse.json({
      success: true,
      data: tier,
    });
  } catch (error) {
    const authResponse = authError(error);

    if (authResponse) {
      return authResponse;
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengambil member tier.",
      },
      { status: 404 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireSuperAdmin();

    const { id } = await context.params;
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          success: false,
          message: "Data member tier tidak valid.",
        },
        { status: 400 },
      );
    }

    const tier = await AdminMemberTierService.update(id, body);

    return NextResponse.json({
      success: true,
      data: tier,
    });
  } catch (error) {
    const authResponse = authError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("[ADMIN_MEMBER_TIER_UPDATE]", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal memperbarui member tier.",
      },
      { status: 400 },
    );
  }
}
