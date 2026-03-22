import { Badge } from "@/components/ui/badge";
import { getStatusBadgeVariant, getStatusLabel } from "@/lib/status-semantics";

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  return (
    <Badge variant={getStatusBadgeVariant(status)} className={className}>
      {label ?? getStatusLabel(status)}
    </Badge>
  );
}
