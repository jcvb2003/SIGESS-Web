import { cn } from "@/shared/lib/utils";
import type { FinancialStatusType } from "../../types/finance.types";
import { StatusBadge, type StatusBadgeVariant } from "@/shared/components/ui/StatusBadge";

const STATUS_CONFIG: Record<
  FinancialStatusType,
  { label: string; dotClass: string; variant: StatusBadgeVariant }
> = {
  ok: {
    label: "Em dia",
    dotClass: "bg-primary",
    variant: "success",
  },
  overdue: {
    label: "Inadimplente",
    dotClass: "bg-destructive",
    variant: "destructive",
  },
  exempt: {
    label: "Isento",
    dotClass: "bg-blue-500",
    variant: "info",
  },
  released: {
    label: "Liberado",
    dotClass: "bg-amber-500",
    variant: "warning",
  },
  alert: {
    label: "Alerta",
    dotClass: "bg-orange-500",
    variant: "orange",
  },
};

interface FinancialStatusBadgeProps {
  readonly status: FinancialStatusType;
  readonly detail?: string;
  readonly className?: string;
}

export function FinancialStatusBadge({
  status,
  detail,
  className,
}: FinancialStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <StatusBadge
      variant={config.variant}
      label={
        <span className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", config.dotClass)} />
          {detail ?? config.label}
        </span>
      }
      className={cn("uppercase tracking-wider font-bold", className)}
    />
  );
}
