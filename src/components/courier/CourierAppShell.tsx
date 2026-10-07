"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CourierBottomNav } from "@/components/courier/CourierUi";

interface CourierAppShellProps {
  children: ReactNode;
  storeName: string;
  siteLogo: string | null;
  siteDescription: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function CourierAppShell({
  children,
}: CourierAppShellProps) {
  const pathname = usePathname();
  const transactional =
    /^\/courier\/tasks\/[^/]+(?:\/proof|\/success)?$/.test(pathname);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7FAFC] text-[#0F2448]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-[#F7FAFC]">
        <main className={transactional ? "min-h-screen" : "min-h-screen pb-[88px]"}>{children}</main>
        {!transactional ? <CourierBottomNav /> : null}
      </div>
    </div>
  );
}

export default CourierAppShell;
