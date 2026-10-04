import { NextResponse } from "next/server";

import { Role } from "@prisma/client";

import { auth } from "@/auth";
import { CourierService } from "@/services/courier/courier.service";

const MAX_PROOF_SIZE = 5 * 1024 * 1024;

export async function POST(
  request: Request,
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

  try {
    const { id } = await params;
    const formData = await request.formData();

    const recipientName = String(formData.get("recipientName") ?? "").trim();
    const recipientNoteValue = formData.get("recipientNote");
    const recipientNote =
      typeof recipientNoteValue === "string"
        ? recipientNoteValue.trim()
        : null;

    const latitudeValue = formData.get("latitude");
    const longitudeValue = formData.get("longitude");
    const latitude =
      typeof latitudeValue === "string" && latitudeValue.trim()
        ? Number(latitudeValue)
        : null;
    const longitude =
      typeof longitudeValue === "string" && longitudeValue.trim()
        ? Number(longitudeValue)
        : null;

    if (!recipientName) {
      return NextResponse.json(
        { code: "RECIPIENT_NAME_REQUIRED", message: "Nama penerima wajib diisi." },
        { status: 400 },
      );
    }

    if (
      (latitude !== null && !Number.isFinite(latitude)) ||
      (longitude !== null && !Number.isFinite(longitude))
    ) {
      return NextResponse.json(
        { code: "INVALID_PROOF_LOCATION", message: "Lokasi bukti pengiriman tidak valid." },
        { status: 400 },
      );
    }

    const photoValue = formData.get("photo");
    const photo = photoValue instanceof File && photoValue.size > 0
      ? photoValue
      : null;

    if (photo && photo.size > MAX_PROOF_SIZE) {
      return NextResponse.json(
        { code: "PROOF_IMAGE_TOO_LARGE", message: "Foto bukti maksimal 5 MB." },
        { status: 400 },
      );
    }

    const proof = await CourierService.createDeliveryProof(
      session.user.id,
      id,
      {
        recipientName,
        recipientNote,
        photo,
        latitude,
        longitude,
      },
    );

    return NextResponse.json({ data: proof }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";

    const statusMap: Record<string, number> = {
      RECIPIENT_NAME_REQUIRED: 400,
      RECIPIENT_NOTE_TOO_LONG: 400,
      INVALID_PROOF_LOCATION: 400,
      DELIVERY_PROOF_NOT_ALLOWED: 409,
      DELIVERY_PROOF_ALREADY_USED: 409,
    };

    const messages: Record<string, string> = {
      RECIPIENT_NAME_REQUIRED: "Nama penerima wajib diisi.",
      RECIPIENT_NOTE_TOO_LONG: "Catatan penerima terlalu panjang.",
      INVALID_PROOF_LOCATION: "Lokasi bukti pengiriman tidak valid.",
      DELIVERY_PROOF_NOT_ALLOWED: "Bukti pengiriman hanya dapat dibuat setelah pesanan diambil.",
      DELIVERY_PROOF_ALREADY_USED: "Bukti pengiriman sudah digunakan.",
    };

    console.error("[COURIER_DELIVERY_PROOF_ERROR]", error);

    return NextResponse.json(
      { code, message: messages[code] ?? "Gagal menyimpan bukti pengiriman." },
      { status: statusMap[code] ?? 500 },
    );
  }
}
