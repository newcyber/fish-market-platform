import { notFound, redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import { CourierService } from "@/services/courier/courier.service";
import { CourierAssignmentDetailView } from "@/components/courier/CourierAssignmentDetailView";

export const dynamic = "force-dynamic";

export default async function CourierAssignmentPage({
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

  return <CourierAssignmentDetailView initial={assignment} />;
}
