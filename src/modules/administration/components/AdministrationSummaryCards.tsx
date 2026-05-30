import { Building2, Shield, Users } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/components/ui/skeleton";

type StatVariant = "default" | "warning" | "destructive";

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  variant?: StatVariant;
  loading?: boolean;
}

const variantStyles: Record<StatVariant, { icon: string; iconBg: string; value: string }> = {
  default: {
    icon: "text-muted-foreground",
    iconBg: "bg-muted",
    value: "text-foreground",
  },
  warning: {
    icon: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    value: "text-amber-600 dark:text-amber-400",
  },
  destructive: {
    icon: "text-destructive",
    iconBg: "bg-destructive/10",
    value: "text-destructive",
  },
};

function StatItem({ icon, label, value, variant = "default", loading }: StatItemProps) {
  const styles = variantStyles[variant];

  return (
    <div className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40 cursor-default">
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors", styles.iconBg, styles.icon)}>
        {icon}
      </div>
      <div className="min-w-0">
        {loading || value === undefined ? (
          <>
            <Skeleton className="h-5 w-10 mb-1" />
            <Skeleton className="h-3 w-16" />
          </>
        ) : (
          <>
            <p className={cn("text-xl font-bold leading-tight tabular-nums", styles.value)}>
              {value}
            </p>
            <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
              {label}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

interface AdministrationSummaryCardsProps {
  readonly activeUnitsCount: number;
  readonly operatorsCount: number;
  readonly accessCount: number;
  readonly totalMembers?: number;
  readonly isLoading?: boolean;
}

export function AdministrationSummaryCards({
  activeUnitsCount,
  unitsCount,
  operatorsCount,
  accessCount,
  totalMembers,
  isLoading,
}: AdministrationSummaryCardsProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden divide-y divide-border/30 sm:divide-y-0 sm:divide-x sm:grid sm:grid-cols-2 lg:grid-cols-4">
      <StatItem
        icon={<Building2 className="h-4 w-4" />}
        label="Polos ativos"
        value={activeUnitsCount}
        loading={isLoading}
      />
      <StatItem
        icon={<Users className="h-4 w-4" />}
        label="Operadores"
        value={operatorsCount}
        loading={isLoading}
      />
      <StatItem
        icon={<Shield className="h-4 w-4" />}
        label="Vinculos ativos"
        value={accessCount}
        loading={isLoading}
      />
      <StatItem
        icon={<Users className="h-4 w-4" />}
        label="Socios"
        value={totalMembers}
        loading={isLoading || totalMembers === undefined}
      />
    </div>
  );
}
