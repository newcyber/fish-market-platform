import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id || !session.user.isActive) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Anda harus login." },
      { status: 401 },
    );
  }

  if (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN) {
    return NextResponse.json(
      { code: "FORBIDDEN", message: "Akses admin diperlukan." },
      { status: 403 },
    );
  }

  const couriers = await prisma.user.findMany({
    where: {
      role: Role.COURIER,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: couriers });
}
