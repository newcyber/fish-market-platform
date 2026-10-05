import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import { CourierNavigation } from "@/components/courier/CourierNavigation";
import { CourierService } from "@/services/courier/courier.service";

export const dynamic = "force-dynamic";

export default async function CourierNavigationPage({
  searchParams,
}: {
  searchParams: Promise<{ assignment?: string | string[] | undefined }>;
}) {
  const session = await auth();

  if (!session?.user?.id || !session.user.isActive) {
    redirect("/login");
  }

  if (session.user.role !== Role.COURIER) {
    redirect(
      session.user.role === Role.ADMIN || session.user.role === Role.SUPER_ADMIN
        ? "/admin"
        : "/customer",
    );
  }

  const dashboard = await CourierService.getDashboard(session.user.id);
  const params = await searchParams;
  const rawAssignment = params.assignment;
  const selectedAssignmentId = Array.isArray(rawAssignment)
    ? rawAssignment[0] ?? null
    : rawAssignment ?? null;

  return (
    <CourierNavigation
      assignments={dashboard.assignments}
      selectedAssignmentId={selectedAssignmentId}
    />
  );
}
