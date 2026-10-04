import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { CourierPerformanceService } from "@/services/courier/courier-performance.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Anda harus login." }, { status: 401 });
  }
  if (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Akses admin diperlukan." }, { status: 403 });
  }

  try {
    const settings = await CourierPerformanceService.getSlaSettings();
    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error("[ADMIN_COURIER_SLA_GET_ERROR]", error);
    return NextResponse.json({ code: "INTERNAL_SERVER_ERROR", message: "Gagal memuat pengaturan SLA." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Anda harus login." }, { status: 401 });
  }
  if (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Akses admin diperlukan." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const settings = await CourierPerformanceService.updateSlaSettings(session.user.id, {
      assignmentToStartMinutes: Number(body.assignmentToStartMinutes),
      startToPickupMinutes: Number(body.startToPickupMinutes),
      pickupToDeliveryMinutes: Number(body.pickupToDeliveryMinutes),
      totalDeliveryMinutes: Number(body.totalDeliveryMinutes),
    });
    return NextResponse.json({ data: settings });
  } catch (error) {
    const code = error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";
    if (code === "INVALID_SLA_SETTINGS") {
      return NextResponse.json({ code, message: "Nilai SLA harus berupa bilangan bulat 1–1440 menit." }, { status: 400 });
    }
    console.error("[ADMIN_COURIER_SLA_PATCH_ERROR]", error);
    return NextResponse.json({ code: "INTERNAL_SERVER_ERROR", message: "Gagal menyimpan pengaturan SLA." }, { status: 500 });
  }
}
