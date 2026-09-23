import { requireSuperAdmin } from "@/lib/auth/admin";
import WapiDeliveryCenter from "@/components/admin/notification/WapiDeliveryCenter";

export default async function WapiDeliveriesPage() {
  await requireSuperAdmin();

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <WapiDeliveryCenter />
    </div>
  );
}
