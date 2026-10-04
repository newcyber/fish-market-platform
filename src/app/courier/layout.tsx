import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import settingsService from "@/services/settings/settings.service";
import { CourierAppShell } from "@/components/courier/CourierAppShell";

export default async function CourierLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!session.user.isActive) {
    redirect("/login");
  }

  if (session.user.role !== Role.COURIER) {
    if (
      session.user.role === Role.ADMIN ||
      session.user.role === Role.SUPER_ADMIN
    ) {
      redirect("/admin");
    }

    redirect("/customer");
  }

  const settings = await settingsService.getSettings();

  return (
    <CourierAppShell
      user={{
        id: session.user.id,
        name: session.user.name ?? "Kurir PISJO",
        email: session.user.email ?? "",
      }}
      storeName={settings.storeName}
      siteLogo={settings.siteLogo}
      siteDescription={settings.storeDescription}
    >
      {children}
    </CourierAppShell>
  );
}
