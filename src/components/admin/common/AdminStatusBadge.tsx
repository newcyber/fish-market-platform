import { Badge } from "@/components/ui/badge";

interface AdminStatusBadgeProps {
  active: boolean;

  activeLabel?: string;

  inactiveLabel?: string;
}

export default function AdminStatusBadge({
  active,
  activeLabel = "Aktif",
  inactiveLabel = "Nonaktif",
}: AdminStatusBadgeProps) {
  return (
    <Badge
      variant={
        active
          ? "default"
          : "secondary"
      }
    >
      {active
        ? activeLabel
        : inactiveLabel}
    </Badge>
  );
}