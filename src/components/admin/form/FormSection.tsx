import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

interface FormSectionProps {
  title: string;

  description?: string;

  children: ReactNode;
}

export default function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <Card className="space-y-6 p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          {title}
        </h2>

        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {children}
    </Card>
  );
}