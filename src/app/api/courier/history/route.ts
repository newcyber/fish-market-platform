import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import { CourierService } from "@/services/courier/courier.service";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id || !session.user.isActive) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Anda harus login." },
      { status: 401 },
    );
  }

  if (session.user.role !== Role.COURIER) {
    return NextResponse.json(
      { code: "FORBIDDEN", message: "Akses kurir diperlukan." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const cursor = url.searchParams.get("cursor") ?? undefined;

  const data = await CourierService.getHistory(
    session.user.id,
    Number.isFinite(limit) ? limit : 20,
    cursor,
  );

  return NextResponse.json({ data });
}
