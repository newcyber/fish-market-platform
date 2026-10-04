import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { CourierPerformanceService, type CourierPerformanceRange } from "@/services/courier/courier-performance.service";

const RANGES = new Set<CourierPerformanceRange>(["today", "7d", "30d"]);

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Anda harus login." }, { status: 401 });
  }
  if (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Akses admin diperlukan." }, { status: 403 });
  }

  const rawRange = new URL(request.url).searchParams.get("range") ?? "today";
  const range = RANGES.has(rawRange as CourierPerformanceRange)
    ? rawRange as CourierPerformanceRange
    : "today";

  try {
    const [performance, slaAttention] = await Promise.all([
      CourierPerformanceService.getPerformance(range),
      CourierPerformanceService.getSlaAttention(50),
    ]);

    return NextResponse.json({ data: { ...performance, slaAttention } });
  } catch (error) {
    console.error("[ADMIN_COURIER_PERFORMANCE_ERROR]", error);
    return NextResponse.json(
      { code: "INTERNAL_SERVER_ERROR", message: "Gagal memuat performa kurir." },
      { status: 500 },
    );
  }
}
