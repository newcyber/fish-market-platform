"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

function formatSegment(segment: string) {
  return segment
    .split("-")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function Breadcrumbs() {
  const pathname = usePathname();

  const segments = pathname
    .split("/")
    .filter(Boolean);

  const adminIndex = segments.indexOf("admin");

  const breadcrumbSegments =
    adminIndex >= 0
      ? segments.slice(adminIndex)
      : segments;

  return (
    <nav
      className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
      aria-label="Breadcrumb"
    >
      {breadcrumbSegments.map(
        (segment, index) => {
          const href =
            "/" +
            breadcrumbSegments
              .slice(0, index + 1)
              .join("/");

          const isLast =
            index ===
            breadcrumbSegments.length - 1;

          const label =
            segment === "admin"
              ? "Dashboard"
              : formatSegment(segment);

          return (
            <div
              key={href}
              className="flex items-center gap-2"
            >
              {index > 0 && (
                <ChevronRight className="h-4 w-4" />
              )}

              {isLast ? (
                <span className="font-medium text-foreground">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="transition-colors hover:text-foreground"
                >
                  {label}
                </Link>
              )}
            </div>
          );
        }
      )}
    </nav>
  );
}

export default Breadcrumbs;