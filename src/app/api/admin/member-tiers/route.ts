import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth/admin";
import { AdminMemberTierService } from "@/services/member-tier/admin-member-tier.service";

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

export async function GET() {
  try {
    await requireSuperAdmin();

    const tiers = await AdminMemberTierService.getAll();

    return NextResponse.json({
      success: true,
      data: tiers,
    });
  } catch (error) {
    const authResponse = authError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("[ADMIN_MEMBER_TIER_GET]", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengambil member tier.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();

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

    const tier = await AdminMemberTierService.create(body);

    return NextResponse.json(
      {
        success: true,
        data: tier,
      },
      { status: 201 },
    );
  } catch (error) {
    const authResponse = authError(error);

    if (authResponse) {
      return authResponse;
    }

    console.error("[ADMIN_MEMBER_TIER_CREATE]", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal membuat member tier.",
      },
      { status: 400 },
    );
  }
}
