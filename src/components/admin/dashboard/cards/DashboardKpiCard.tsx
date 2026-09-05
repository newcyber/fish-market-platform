import type { LucideIcon } from "lucide-react";

interface DashboardKpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
}

export function DashboardKpiCard({
  title,
  value,
  description,
  icon: Icon,
}: DashboardKpiCardProps) {
  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-muted-foreground">
            {title}
          </p>

          <p
            className="mt-2 whitespace-nowrap text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl"
            title={String(value)}
          >
            {value}
          </p>

          {description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pisjo-soft-blue)] text-[var(--pisjo-primary)] sm:h-11 sm:w-11">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}
