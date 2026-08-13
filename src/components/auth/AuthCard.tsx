import type { ReactNode } from "react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

export function AuthCard({
  children,
  className,
}: AuthCardProps) {
  return (
    <Card
      className={[
        "w-full border-border/60 shadow-xl shadow-black/5 backdrop-blur-sm",
        "dark:shadow-black/30",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <CardContent className="p-8 md:p-10">
        {children}
      </CardContent>
    </Card>
  );
}