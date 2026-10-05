import { requireSuperAdmin } from "@/lib/auth/admin";
import WapiCourierDeliveryCenter from "@/components/admin/notification/WapiCourierDeliveryCenter";

export default async function WapiCourierDeliveriesPage() {
  await requireSuperAdmin();

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <WapiCourierDeliveryCenter />
    </div>
  );
}
