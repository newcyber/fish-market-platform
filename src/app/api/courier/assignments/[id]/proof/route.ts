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

    const latitudeValue = formData.get("latitude");
    const longitudeValue = formData.get("longitude");
    const latitude =
      typeof latitudeValue === "string" ? Number(latitudeValue) : NaN;
    const longitude =
      typeof longitudeValue === "string" ? Number(longitudeValue) : NaN;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json(
        { code: "INVALID_PROOF_LOCATION", message: "GPS wajib tersedia sebelum konfirmasi." },
        { status: 400 },
      );
    }

    const photoValue = formData.get("photo");
    const photo =
      photoValue instanceof File && photoValue.size > 0
        ? photoValue
        : null;

    if (!photo) {
      return NextResponse.json(
        { code: "PROOF_PHOTO_REQUIRED", message: "Foto bukti pengantaran wajib diambil." },
        { status: 400 },
      );
    }

    if (!photo.type.startsWith("image/")) {
      return NextResponse.json(
        { code: "PROOF_PHOTO_REQUIRED", message: "File bukti harus berupa gambar." },
        { status: 400 },
      );
    }

    if (photo.size > MAX_PROOF_SIZE) {
      return NextResponse.json(
        { code: "PROOF_IMAGE_TOO_LARGE", message: "Foto bukti maksimal 5 MB." },
        { status: 400 },
      );
    }

    const proof = await CourierService.createDeliveryProof(
      session.user.id,
      id,
      {
        photo,
        latitude,
        longitude,
      },
    );

    return NextResponse.json({ data: proof }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";

    const statusMap: Record<string, number> = {
      PROOF_PHOTO_REQUIRED: 400,
      PROOF_IMAGE_TOO_LARGE: 400,
      INVALID_PROOF_LOCATION: 400,
      DELIVERY_PROOF_NOT_ALLOWED: 409,
      DELIVERY_PROOF_ALREADY_USED: 409,
    };

    const messages: Record<string, string> = {
      PROOF_PHOTO_REQUIRED: "Foto bukti pengantaran wajib diambil.",
      PROOF_IMAGE_TOO_LARGE: "Foto bukti maksimal 5 MB.",
      INVALID_PROOF_LOCATION: "GPS wajib aktif dan valid.",
      DELIVERY_PROOF_NOT_ALLOWED: "Bukti pengantaran hanya dapat dibuat setelah kurir tiba di lokasi.",
      DELIVERY_PROOF_ALREADY_USED: "Bukti pengantaran sudah digunakan.",
    };

    console.error("[COURIER_DELIVERY_PROOF_ERROR]", error);

    return NextResponse.json(
      { code, message: messages[code] ?? "Gagal menyimpan bukti pengiriman." },
      { status: statusMap[code] ?? 500 },
    );
  }
}
