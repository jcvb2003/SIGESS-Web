import { AlertCircle, Building2, FileText, Shield, Users } from "lucide-react";
import { StatCard } from "@/shared/components/ui/StatCard";

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
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
      <StatCard
        title="Socios"
        value={totalMembers ?? "—"}
        icon={Users}
        description="Total consolidado da entidade"
        loading={isLoading || totalMembers === undefined}
        variant="primary"
      />
      <StatCard
        title="Requerimentos em aberto"
        value={pendingRequirements ?? "—"}
        icon={FileText}
        description="Pendentes de analise"
        loading={isLoading || pendingRequirements === undefined}
        variant={pendingRequirements ? "warning" : "default"}
      />
      <StatCard
        title="Em atraso"
        value={defaulters ?? "—"}
        icon={AlertCircle}
        description="Socios com contribuicao vencida"
        loading={isLoading || defaulters === undefined}
        variant={defaulters ? "destructive" : "default"}
      />
      <StatCard
        title="Polos ativos"
        value={activeUnitsCount}
        icon={Building2}
        description={`${unitsCount} cadastrado${unitsCount !== 1 ? "s" : ""} no total`}
        loading={isLoading}
        variant="info"
      />
      <StatCard
        title="Operadores"
        value={operatorsCount}
        icon={Users}
        description="Cadastrados na entidade"
        loading={isLoading}
        variant="info"
      />
      <StatCard
        title="Vinculos ativos"
        value={accessCount}
        icon={Shield}
        description="Operador por polo"
        loading={isLoading}
        variant="secondary"
      />
    </div>
  );
}
