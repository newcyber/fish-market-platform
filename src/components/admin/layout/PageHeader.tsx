import { Button } from "@/components/ui/button";

import {
  Plus,
} from "lucide-react";

import type {
  ReactNode,
} from "react";

interface PageHeaderProps {
  title: string;

  description?: string;

  action?: ReactNode;

  showDefaultButton?: boolean;

  defaultButtonLabel?: string;

  onDefaultAction?: () => void;
}

export default function PageHeader({
  title,
  description,

  action,

  showDefaultButton = false,

  defaultButtonLabel = "Tambah",

  onDefaultAction,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

      <div className="space-y-1">

        <h1 className="text-3xl font-bold tracking-tight">
          {title}
        </h1>

        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}

      </div>

      {action ? (
        action
      ) : showDefaultButton ? (
        <Button
          type="button"
          onClick={onDefaultAction}
        >
          <Plus className="mr-2 h-4 w-4" />

          {defaultButtonLabel}
        </Button>
      ) : null}

    </div>
  );
}