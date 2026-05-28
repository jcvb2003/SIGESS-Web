import { AlertCircle, Building2, FileText, Shield, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

interface AdministrationSummaryCardsProps {
  readonly activeUnitsCount: number;
  readonly unitsCount: number;
  readonly operatorsCount: number;
  readonly accessCount: number;
  readonly totalMembers?: number;
  readonly pendingRequirements?: number;
  readonly defaulters?: number;
}

function StatCard({
  icon,
  title,
  description,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: number | undefined;
}) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {value === undefined ? (
            <span className="text-muted-foreground text-2xl">—</span>
          ) : (
            value
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AdministrationSummaryCards({
  activeUnitsCount,
  unitsCount,
  operatorsCount,
  accessCount,
  totalMembers,
  pendingRequirements,
  defaulters,
}: AdministrationSummaryCardsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Building2 className="h-5 w-5 text-primary" />}
          title="Polos ativos"
          description={`${unitsCount} cadastrado${unitsCount !== 1 ? "s" : ""} no total`}
          value={activeUnitsCount}
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-primary" />}
          title="Operadores"
          description="Cadastrados na entidade"
          value={operatorsCount}
        />
        <StatCard
          icon={<Shield className="h-5 w-5 text-primary" />}
          title="Acessos ativos"
          description="Vinculos operador-polo"
          value={accessCount}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Users className="h-5 w-5 text-emerald-600" />}
          title="Socios"
          description="Total consolidado da entidade"
          value={totalMembers}
        />
        <StatCard
          icon={<FileText className="h-5 w-5 text-amber-500" />}
          title="Requerimentos pendentes"
          description="Soma de todos os polos"
          value={pendingRequirements}
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5 text-destructive" />}
          title="Inadimplentes"
          description="Socios com mensalidade em atraso"
          value={defaulters}
        />
      </div>
    </div>
  );
}
