import { Building2, Shield, ToggleRight, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

interface AdministrationSummaryCardsProps {
  readonly unitsCount: number;
  readonly activeUnitsCount: number;
  readonly activeUsersCount: number;
  readonly ownerUsersCount: number;
  readonly membershipsCount: number;
}

export function AdministrationSummaryCards({
  unitsCount,
  activeUnitsCount,
  activeUsersCount,
  ownerUsersCount,
  membershipsCount,
}: AdministrationSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Polos
          </CardTitle>
          <CardDescription>Total cadastrado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{unitsCount}</div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ToggleRight className="h-5 w-5 text-emerald-600" />
            Polos ativos
          </CardTitle>
          <CardDescription>Em operacao na entidade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{activeUnitsCount}</div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Usuarios da entidade
          </CardTitle>
          <CardDescription>Universo interno permitido</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{activeUsersCount}</div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Responsaveis
          </CardTitle>
          <CardDescription>Gestores da entidade</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <div className="text-3xl font-bold text-foreground">{ownerUsersCount}</div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Acessos ativos
          </CardTitle>
          <CardDescription>Vinculos entre usuarios e polos</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <div className="text-3xl font-bold text-foreground">{membershipsCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}
