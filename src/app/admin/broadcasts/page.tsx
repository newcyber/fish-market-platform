import BroadcastManager from "./BroadcastManager";
import BroadcastService from "@/services/broadcast/broadcast.service";

export default async function AdminBroadcastsPage() {
  const broadcasts = await BroadcastService.list();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Broadcast Customer</h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-500">Kirim informasi promo, Flash Sale, voucher, dan pesan marketing langsung ke notification center customer.</p>
      </div>
      <BroadcastManager initial={broadcasts.map((item) => ({
        ...item,
        scheduledAt: item.scheduledAt?.toISOString() ?? null,
        sentAt: item.sentAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
      }))} />
    </div>
  );
}
