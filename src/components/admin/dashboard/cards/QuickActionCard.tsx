import Link from "next/link";

import type { LucideIcon } from "lucide-react";

import { ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface QuickActionCardProps {
  title: string;

  description: string;

  href: string;

  icon: LucideIcon;

  disabled?: boolean;
}

export function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
  disabled = false,
}: QuickActionCardProps) {
  const content = (
    <Card
      className={[
        "group transition-all duration-200",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:-translate-y-1 hover:shadow-lg",
      ].join(" ")}
    >
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>

          <div>
            <h3 className="font-semibold">
              {title}
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {!disabled && (
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        )}
      </CardContent>
    </Card>
  );

  if (disabled) {
    return content;
  }

  return (
    <Link href={href}>
      {content}
    </Link>
  );
}

export default QuickActionCard;