import type { ReactNode } from "react";

interface AdminToolbarProps {
  search?: ReactNode;

  filters?: ReactNode;

  actions?: ReactNode;
}

export default function AdminToolbar({
  search,
  filters,
  actions,
}: AdminToolbarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row">
        {search}

        {filters}
      </div>

      {actions && (
        <div className="flex shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}