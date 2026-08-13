import type { ReactNode } from "react";

import Link from "next/link";

import { Button } from "@/components/ui/button";

interface FormActionsProps {
  cancelHref: string;

  cancelLabel?: string;

  children: ReactNode;
}

export default function FormActions({
  cancelHref,
  cancelLabel = "Batal",
  children,
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3">
      <Link href={cancelHref}>
        <Button
          type="button"
          variant="outline"
        >
          {cancelLabel}
        </Button>
      </Link>

      {children}
    </div>
  );
}