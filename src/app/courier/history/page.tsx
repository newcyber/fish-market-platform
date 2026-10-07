import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import { CourierService } from "@/services/courier/courier.service";
import { CourierHistory } from "@/components/courier/CourierHistory";

export const dynamic = "force-dynamic";

export default async function CourierHistoryPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) redirect("/login");
  if (session.user.role !== Role.COURIER) redirect("/courier");

  const history = await CourierService.getHistory(session.user.id, 100);
  return <CourierHistory initial={history.items} />;
}
