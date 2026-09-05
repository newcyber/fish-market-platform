"use client";

import { useState } from "react";
import type { Role } from "@prisma/client";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Breadcrumbs from "./Breadcrumbs";

export interface AppShellProps {
  children: React.ReactNode;
  storeName: string;
  siteLogo: string | null;
  siteDescription: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export function AppShell({
  children,
  storeName,
  siteLogo,
  siteDescription,
  user,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        storeName={storeName}
        siteLogo={siteLogo}
        siteDescription={siteDescription}
        user={user}
      />

      <div className="min-h-screen lg:pl-72">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="min-w-0 p-3 sm:p-4 md:p-6 lg:p-8">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
