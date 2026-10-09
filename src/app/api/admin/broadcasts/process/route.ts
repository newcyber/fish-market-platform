import { NextResponse } from "next/server";
import BroadcastService from "@/services/broadcast/broadcast.service";

export async function POST(request: Request) {
  const secret = process.env.BROADCAST_CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization")?.trim();
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Invalid broadcast processor credential." }, { status: 401 });
  }
  try {
    const results = await BroadcastService.processDue(20);
    return NextResponse.json({ data: { processed: results.length, results } });
  } catch (error) {
    console.error("[BROADCAST_PROCESSOR_ERROR]", error);
    return NextResponse.json({ code: "INTERNAL_SERVER_ERROR", message: "Gagal memproses scheduled broadcast." }, { status: 500 });
  }
}
