import { requireSuperAdmin } from "@/lib/auth/admin";
import WapiCustomerDeliveryCenter from "@/components/admin/notification/WapiCustomerDeliveryCenter";

export default async function WapiCustomerDeliveriesPage() {
  await requireSuperAdmin();

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <WapiCustomerDeliveryCenter />
    </div>
  );
}
