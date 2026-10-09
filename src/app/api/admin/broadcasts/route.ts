import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import BroadcastService from "@/services/broadcast/broadcast.service";

function isAdmin(role: Role | undefined) {
  return role === Role.ADMIN || role === Role.SUPER_ADMIN;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Anda harus login." }, { status: 401 });
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Akses admin diperlukan." }, { status: 403 });
  }

  const broadcasts = await BroadcastService.list();
  return NextResponse.json({
    data: broadcasts.map((item) => ({
      ...item,
      scheduledAt: item.scheduledAt?.toISOString() ?? null,
      startedAt: item.startedAt?.toISOString() ?? null,
      sentAt: item.sentAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Anda harus login." }, { status: 401 });
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Akses admin diperlukan." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      message?: string;
      href?: string | null;
      imageUrl?: string | null;
      scheduledAt?: string | null;
    };

    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ code: "INVALID_SCHEDULE", message: "Jadwal broadcast tidak valid." }, { status: 400 });
    }

    const broadcast = await BroadcastService.create(
      {
        title: body.title ?? "",
        message: body.message ?? "",
        href: body.href,
        imageUrl: body.imageUrl,
        scheduledAt,
      },
      session.user.id,
    );

    return NextResponse.json({ data: broadcast }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat broadcast.";
    return NextResponse.json({ code: "INVALID_BROADCAST", message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Anda harus login." }, { status: 401 });
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Akses admin diperlukan." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { id?: string; action?: "SEND" | "CANCEL" };
    if (!body.id || !body.action) {
      return NextResponse.json({ code: "INVALID_INPUT", message: "Broadcast dan aksi wajib diisi." }, { status: 400 });
    }

    if (body.action === "CANCEL") {
      await BroadcastService.cancel(body.id);
      return NextResponse.json({ data: { id: body.id, status: "CANCELLED" } });
    }

    const result = await BroadcastService.sendNow(body.id);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memproses broadcast.";
    return NextResponse.json({ code: "BROADCAST_PROCESS_ERROR", message }, { status: 400 });
  }
}
