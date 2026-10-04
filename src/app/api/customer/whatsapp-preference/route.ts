import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Silakan login terlebih dahulu.",
        },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        phone: true,
        wapiTransactionalEnabled: true,
        wapiMarketingOptIn: true,
        wapiMarketingOptInAt: true,
        wapiMarketingOptOutAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        phone: user.phone,
        transactionalEnabled: user.wapiTransactionalEnabled,
        marketingOptIn: user.wapiMarketingOptIn,
        marketingOptInAt: user.wapiMarketingOptInAt,
        marketingOptOutAt: user.wapiMarketingOptOutAt,
      },
    });
  } catch (error) {
    console.error("[CUSTOMER_WAPI_PREFERENCE_GET_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil preferensi WhatsApp.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Silakan login terlebih dahulu.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const data: {
      wapiTransactionalEnabled?: boolean;
      wapiMarketingOptIn?: boolean;
      wapiMarketingOptInAt?: Date | null;
      wapiMarketingOptOutAt?: Date | null;
    } = {};

    if (body.transactionalEnabled !== undefined) {
      if (typeof body.transactionalEnabled !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "transactionalEnabled harus berupa boolean.",
          },
          { status: 400 },
        );
      }

      data.wapiTransactionalEnabled = body.transactionalEnabled;
    }

    if (body.marketingOptIn !== undefined) {
      if (typeof body.marketingOptIn !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "marketingOptIn harus berupa boolean.",
          },
          { status: 400 },
        );
      }

      data.wapiMarketingOptIn = body.marketingOptIn;

      if (body.marketingOptIn) {
        data.wapiMarketingOptInAt = new Date();
        data.wapiMarketingOptOutAt = null;
      } else {
        data.wapiMarketingOptOutAt = new Date();
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak ada perubahan yang dikirim.",
        },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        phone: true,
        wapiTransactionalEnabled: true,
        wapiMarketingOptIn: true,
        wapiMarketingOptInAt: true,
        wapiMarketingOptOutAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Preferensi WhatsApp berhasil diperbarui.",
      data: {
        phone: updated.phone,
        transactionalEnabled: updated.wapiTransactionalEnabled,
        marketingOptIn: updated.wapiMarketingOptIn,
        marketingOptInAt: updated.wapiMarketingOptInAt,
        marketingOptOutAt: updated.wapiMarketingOptOutAt,
      },
    });
  } catch (error) {
    console.error("[CUSTOMER_WAPI_PREFERENCE_PATCH_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal memperbarui preferensi WhatsApp.",
      },
      { status: 500 },
    );
  }
}
