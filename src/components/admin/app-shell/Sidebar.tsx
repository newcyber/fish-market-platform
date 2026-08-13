"use client";

import type { Role } from "@prisma/client";

import { SidebarHeader } from "./SidebarHeader";
import { SidebarContent } from "./SidebarContent";
import { SidebarFooter } from "./SidebarFooter";

interface SidebarUser {
  name: string | null;
  email: string | null;
  role: Role;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  storeName: string;
  user: SidebarUser;
}

export function Sidebar({
  open,
  onClose,
  storeName,
  user,
}: SidebarProps) {
  return (
    <>
      {/* Overlay Mobile */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/50 lg:hidden",
          open ? "block" : "hidden",
        ].join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-background transition-transform duration-300 ease-in-out",
          open
            ? "translate-x-0"
            : "-translate-x-full",
          "lg:translate-x-0",
        ].join(" ")}
      >
        <SidebarHeader
          storeName={storeName}
        />

        <SidebarContent
          role={user.role}
        />

        <SidebarFooter
          user={user}
        />
      </aside>
    </>
  );
}

export default Sidebar;