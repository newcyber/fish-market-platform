import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import { CourierDashboard } from "@/components/courier/CourierDashboard";
import { CourierService } from "@/services/courier/courier.service";

export const dynamic = "force-dynamic";

export default async function CourierDashboardPage() {
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

  return <CourierDashboard initialData={dashboard} />;
}
