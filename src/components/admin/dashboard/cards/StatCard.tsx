import type { LucideIcon } from "lucide-react";

import { ArrowDown, ArrowUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

interface StatCardProps {
  title: string;

  value: string | number;

  description?: string;

  icon: LucideIcon;

  trend?: {
    value: string;
    direction: "up" | "down";
  };

  badge?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  badge,
}: StatCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>

          <div className="text-3xl font-bold tracking-tight">
            {value}
          </div>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}

        <div className="flex items-center justify-between">
          {trend ? (
            <Badge
              variant={
                trend.direction === "up"
                  ? "default"
                  : "destructive"
              }
              className="gap-1"
            >
              {trend.direction === "up" ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}

              {trend.value}
            </Badge>
          ) : (
            <span />
          )}

          {badge && (
            <Badge variant="secondary">
              {badge}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default StatCard;