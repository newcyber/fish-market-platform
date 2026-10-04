import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { CourierService } from "@/services/courier/courier.service";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Anda harus login." }, { status: 401 });
  }
  if (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Akses admin diperlukan." }, { status: 403 });
  }

  try {
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? "50");
    const items = await CourierService.getDeliveryAttention(Number.isFinite(limit) ? limit : 50);
    return NextResponse.json({ data: { items } });
  } catch (error) {
    console.error("[ADMIN_COURIER_ATTENTION_ERROR]", error);
    return NextResponse.json({ code: "INTERNAL_SERVER_ERROR", message: "Gagal memuat delivery attention." }, { status: 500 });
  }
}
