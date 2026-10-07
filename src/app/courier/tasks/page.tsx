import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import { CourierService } from "@/services/courier/courier.service";
import { CourierTasks } from "@/components/courier/CourierTasks";

export const dynamic = "force-dynamic";

export default async function CourierTasksPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string | string[] }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) redirect("/login");
  if (session.user.role !== Role.COURIER) redirect("/courier");

  const dashboard = await CourierService.getDashboard(session.user.id);
  const history = await CourierService.getHistory(session.user.id, 50);

  const raw = (await searchParams)?.tab;
  const tab = Array.isArray(raw) ? raw[0] : raw;

  return (
    <CourierTasks
      active={dashboard.assignments}
      history={history.items}
      stats={dashboard.stats}
      initialTab={
        tab === "delivered" || tab === "failed" ? tab : "active"
      }
    />
  );
}
