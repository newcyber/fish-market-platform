import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import { CourierService } from "@/services/courier/courier.service";
import { CourierProofView } from "@/components/courier/CourierProofView";

export const dynamic = "force-dynamic";

export default async function CourierProofPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) redirect("/login");
  if (session.user.role !== Role.COURIER) redirect("/courier");

  const { id } = await params;
  const assignment = await CourierService.getAssignment(session.user.id, id);
  if (!assignment) redirect("/courier/tasks");
  if (assignment.status !== "ARRIVED") {
    redirect(`/courier/tasks/${id}`);
  }

  return <CourierProofView assignment={assignment} />;
}
