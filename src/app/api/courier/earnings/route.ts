import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import { CourierService } from "@/services/courier/courier.service";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Anda harus login." }, { status: 401 });
  }
  if (session.user.role !== Role.COURIER) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Akses kurir diperlukan." }, { status: 403 });
  }

  const period = new URL(request.url).searchParams.get("period");
  const safePeriod =
    period === "7d" || period === "month" ? period : "today";

  const data = await CourierService.getEarnings(session.user.id, safePeriod);
  return NextResponse.json({ data });
}
