"use client";

import type { Role } from "@prisma/client";

import { ADMIN_NAVIGATION } from "@/config/admin-navigation";

import { SidebarItem } from "@/components/admin/navigation/SidebarItem";

interface SidebarContentProps {
  role?: Role | null;
}

export function SidebarContent({
  role,
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
      className="flex-1 overflow-y-auto px-3 py-4"
      aria-label="Main Navigation"
    >
      <ul className="space-y-1">
        {navigation.map((item) => (
          <li key={item.id}>
            <SidebarItem item={item} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default SidebarContent;