import { AlertCircle, Building2, FileText, Shield, Users } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/components/ui/skeleton";

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  variant?: "default" | "warning" | "destructive";
  loading?: boolean;
}

function StatItem({ icon, label, value, variant = "default", loading }: StatItemProps) {
  const valueColor =
    variant === "warning"
      ? "text-amber-600 dark:text-amber-400"
      : variant === "destructive"
        ? "text-destructive"
        : "text-foreground";

  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <div className="text-muted-foreground shrink-0">{icon}</div>
      <div className="min-w-0">
        {loading || value === undefined ? (
          <Skeleton className="h-4 w-10 mb-1" />
        ) : (
          <p className={cn("text-lg font-semibold leading-tight tabular-nums", valueColor)}>
            {value}
          </p>
        )}
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}

interface AdministrationSummaryCardsProps {
  readonly activeUnitsCount: number;
  readonly unitsCount: number;
  readonly operatorsCount: number;
  readonly accessCount: number;
  readonly totalMembers?: number;
  readonly pendingRequirements?: number;
  readonly defaulters?: number;
  readonly isLoading?: boolean;
}

export function AdministrationSummaryCards({
  activeUnitsCount,
  unitsCount,
  operatorsCount,
  accessCount,
  totalMembers,
  pendingRequirements,
  defaulters,
  isLoading,
}: AdministrationSummaryCardsProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-sm divide-y divide-border/50 sm:divide-y-0 sm:divide-x sm:grid sm:grid-cols-3 lg:grid-cols-6">
      <StatItem
        icon={<Users className="h-4 w-4" />}
        label="Socios"
        value={totalMembers}
        loading={isLoading || totalMembers === undefined}
      />
      <StatItem
        icon={<Building2 className="h-4 w-4" />}
        label={`Polos (${unitsCount} total)`}
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
        icon={<FileText className="h-4 w-4" />}
        label="Req. em aberto"
        value={pendingRequirements}
        variant={pendingRequirements ? "warning" : "default"}
        loading={isLoading || pendingRequirements === undefined}
      />
      <StatItem
        icon={<AlertCircle className="h-4 w-4" />}
        label="Em atraso"
        value={defaulters}
        variant={defaulters ? "destructive" : "default"}
        loading={isLoading || defaulters === undefined}
      />
    </div>
  );
}
