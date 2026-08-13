import type {
  PropsWithChildren,
} from "react";

import { Card } from "@/components/ui/card";

interface SectionCardProps
  extends PropsWithChildren {
  className?: string;
}

export default function SectionCard({
  children,
  className,
}: SectionCardProps) {
  return (
    <Card
      className={[
        "rounded-xl p-6 shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Card>
  );
}