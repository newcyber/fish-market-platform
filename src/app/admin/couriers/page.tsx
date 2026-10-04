import {
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/admin/layout";
import CourierAssignmentPanel from "@/components/admin/courier/CourierAssignmentPanel";
import CourierPerformancePanel from "@/components/admin/courier/CourierPerformancePanel";

export const dynamic = "force-dynamic";

export default function AdminCouriersPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Kurir Internal"
        description="Tugaskan pesanan yang siap dikirim kepada kurir internal PISJO."
      />
      <SectionCard>
        <CourierAssignmentPanel />
      </SectionCard>
      <CourierPerformancePanel />
    </PageContainer>
  );
}
