import { Badge } from "@/components/ui/badge";

import type { VariantProps } from "class-variance-authority";

import { badgeVariants } from "@/components/ui/badge";

interface EntityBadgeProps {
  label: string;

  variant?: VariantProps<
    typeof badgeVariants
  >["variant"];
}

export default function EntityBadge({
  label,
  variant = "secondary",
}: EntityBadgeProps) {
  return (
    <Badge variant={variant}>
      {label}
    </Badge>
  );
}