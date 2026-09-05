"use client";

import SidebarContent from "./SidebarContent";
import SidebarFooter from "./SidebarFooter";
import { SidebarHeader } from "./SidebarHeader";
import type { Role } from "@prisma/client";

interface SidebarUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  storeName: string;
  siteLogo: string | null;
  siteDescription: string | null;
  user: SidebarUser;
}

export default function Sidebar({
  open,
  onClose,
  storeName,
  siteLogo,
  siteDescription,
  user,
}: SidebarProps) {
  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:shadow-none",
        ].join(" ")}
      >
        <SidebarHeader
          storeName={storeName}
          siteLogo={siteLogo}
          siteDescription={siteDescription}
          onClose={onClose}
        />

        <SidebarContent
          role={user.role}
          onNavigate={onClose}
        />

        <SidebarFooter user={user} />
      </aside>
    </>
  );
}
