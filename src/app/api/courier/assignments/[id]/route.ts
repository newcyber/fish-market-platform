import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import { CourierService } from "@/services/courier/courier.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  const assignment = await CourierService.getAssignment(session.user.id, id);

  if (!assignment) {
    return NextResponse.json(
      { code: "COURIER_ASSIGNMENT_NOT_FOUND", message: "Tugas pengantaran tidak ditemukan." },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: assignment });
}
