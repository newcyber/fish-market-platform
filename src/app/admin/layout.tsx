import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { AppShell } from "@/components/admin/app-shell/AppShell";

import settingsService from "@/services/settings/settings.service";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const settings =
    await settingsService.getSettings();

  const user = {
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    role: session.user.role ?? "ADMIN",
  };

  return (
    <AppShell
      storeName={settings.storeName}
      user={user}
    >
      {children}
    </AppShell>
  );
}