"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";

import {
  Breadcrumb as UIBreadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const LABELS: Record<string, string> = {
  admin: "Dashboard",
  products: "Products",
  categories: "Categories",
  orders: "Orders",
  customers: "Customers",
  payments: "Payments",
  reports: "Reports",
  settings: "Settings",
  profile: "Profile",
  create: "Create",
  edit: "Edit",
};

function formatSegment(segment: string) {
  return (
    LABELS[segment] ??
    segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

export function Breadcrumb() {
  const pathname = usePathname();

  const segments = pathname
    .split("/")
    .filter(Boolean);

  return (
    <UIBreadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const href =
            "/" +
            segments.slice(0, index + 1).join("/");

          const isLast =
            index === segments.length - 1;

          return (
            <Fragment key={href}>
              {index > 0 && <BreadcrumbSeparator />}

              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>
                    {formatSegment(segment)}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>
                    {formatSegment(segment)}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </UIBreadcrumb>
  );
}

export default Breadcrumb;