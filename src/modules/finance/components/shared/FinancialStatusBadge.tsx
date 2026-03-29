import { cn } from "@/shared/lib/utils";
import type { FinancialStatusType } from "../../types/finance.types";

const STATUS_CONFIG: Record<
  FinancialStatusType,
  { label: string; dotClass: string; badgeClass: string }
> = {
  ok: {
    label: "Em dia",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  overdue: {
    label: "Inadimplente",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-50 text-red-700 border-red-100",
  },
  exempt: {
    label: "Isento",
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-100",
  },
  released: {
    label: "Liberado",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-100",
  },
  alert: {
    label: "Alerta",
    dotClass: "bg-orange-500",
    badgeClass: "bg-orange-100 text-orange-800",
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
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
        config.badgeClass,
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", config.dotClass)}
      />
      {detail ?? config.label}
    </span>
  );
}
