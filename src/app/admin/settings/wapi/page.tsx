import PageHeader from "@/components/admin/layout/PageHeader";
import { WapiSetting } from "@/components/admin/wapi/WapiSetting";

export default function WapiSettingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="WAPI Setting"
        description="Kelola koneksi WhatsApp API Pisjo Market."
      />

      <WapiSetting />
    </div>
  );
}