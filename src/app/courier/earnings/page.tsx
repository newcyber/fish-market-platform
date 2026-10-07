import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import { CourierService } from "@/services/courier/courier.service";
import { CourierEarnings } from "@/components/courier/CourierEarnings";

export const dynamic = "force-dynamic";

export default async function CourierEarningsPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) redirect("/login");
  if (session.user.role !== Role.COURIER) redirect("/courier");

  const data = await CourierService.getEarnings(session.user.id, "today");
  return <CourierEarnings initial={data} />;
}
