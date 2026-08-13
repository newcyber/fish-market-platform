"use client";

import { useState } from "react";
import type { Role } from "@prisma/client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Breadcrumbs } from "./Breadcrumbs";

interface AppShellUser {
  name: string | null;
  email: string | null;
  role: Role;
}

interface AppShellProps {
  children: React.ReactNode;
  storeName: string;
  user: AppShellUser;
}

export function AppShell({
  children,
  storeName,
  user,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        storeName={storeName}
        user={user}
      />

      <div className="lg:pl-72">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="p-4 md:p-6 lg:p-8">
          <Breadcrumbs />

          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;