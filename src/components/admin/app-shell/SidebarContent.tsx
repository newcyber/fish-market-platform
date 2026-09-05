"use client";

import type { Role } from "@prisma/client";

import { ADMIN_NAVIGATION } from "@/config/admin-navigation";
import { SidebarItem } from "@/components/admin/navigation/SidebarItem";

interface SidebarContentProps {
  role?: Role | null;
  onNavigate?: () => void;
}

export function SidebarContent({
  role,
  onNavigate,
}: SidebarContentProps) {
  if (!role) {
    return null;
  }

  const navigation = ADMIN_NAVIGATION
    .filter((item) => {
      if (item.hidden) {
        return false;
      }

      return item.roles.includes(role);
    })
    .sort((a, b) => a.order - b.order);

  return (
    <nav
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4"
      aria-label="Main Navigation"
    >
      <ul className="space-y-1">
        {navigation.map((item) => (
          <li key={item.id}>
            <SidebarItem
              item={item}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default SidebarContent;
