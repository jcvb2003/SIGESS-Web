import { cn } from "@/shared/lib/utils";
import type { FinancialStatusType } from "../../types/finance.types";

const STATUS_CONFIG: Record<
  FinancialStatusType,
  { label: string; dotClass: string; badgeClass: string }
> = {
  ok: {
    label: "Em dia",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50",
  },
  overdue: {
    label: "Inadimplente",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50",
  },
  exempt: {
    label: "Isento",
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/50",
  },
  released: {
    label: "Liberado",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50",
  },
  alert: {
    label: "Alerta",
    dotClass: "bg-orange-500",
    badgeClass: "bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-900/50",
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
