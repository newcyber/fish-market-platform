import { notFound, redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import { CourierService } from "@/services/courier/courier.service";
import { CourierSuccessView } from "@/components/courier/CourierSuccessView";

export const dynamic = "force-dynamic";

export default async function CourierSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) redirect("/login");
  if (session.user.role !== Role.COURIER) redirect("/courier");

  const { id } = await params;
  const assignment = await CourierService.getAssignment(session.user.id, id);
  if (!assignment) notFound();
  if (assignment.status !== "DELIVERED") redirect(`/courier/tasks/${id}`);

  const dashboard = await CourierService.getDashboard(session.user.id);
  const next = dashboard.assignments.find((row) => row.id !== id) ?? null;

  return (
    <CourierSuccessView
      assignment={assignment}
      nextAssignment={next}
      completedToday={dashboard.stats.deliveredToday}
      earningsToday={dashboard.stats.earningsToday}
    />
  );
}
