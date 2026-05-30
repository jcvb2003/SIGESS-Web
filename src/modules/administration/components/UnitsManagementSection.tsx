import { useMemo } from "react";
import { Building2, Edit, LogIn, Plus } from "lucide-react";
import type {
  TenantMembershipRecord,
  TenantUnitRecord,
} from "@/modules/administration/services/administrationService";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

interface UnitStat {
  sociosCount: number;
  pendingReqCount: number;
}

interface UnitsManagementSectionProps {
  readonly units: TenantUnitRecord[];
  readonly memberships: TenantMembershipRecord[];
  readonly unitStats?: Record<string, UnitStat>;
  readonly isLoading: boolean;
  readonly onEdit: (unit: TenantUnitRecord) => void;
  readonly onEnter: (unit: TenantUnitRecord) => void;
  readonly onCreate: () => void;
}

export function UnitsManagementSection({
  units,
  memberships,
  unitStats,
  isLoading,
  onEdit,
  onEnter,
  onCreate,
}: UnitsManagementSectionProps) {
  const operatorsByUnit = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of memberships) {
      if (m.unitId) map.set(m.unitId, (map.get(m.unitId) ?? 0) + 1);
    }
    return map;
  }, [memberships]);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Polos
          </CardTitle>
          <CardDescription>
            Visao operacional e configuracao de cada polo da entidade.
          </CardDescription>
        </div>
        <Button onClick={onCreate} variant="outline" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Novo polo
        </Button>
      </CardHeader>
      <CardContent className="border-t border-border/10 pt-0 px-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Polo</TableHead>
              <TableHead>Codigo</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead className="text-center">Operadores</TableHead>
              <TableHead className="text-center">Socios</TableHead>
              <TableHead className="text-center">Req. pendentes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-6 text-right w-24">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Carregando polos...
                </TableCell>
              </TableRow>
            ) : units.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Comece criando o primeiro polo da entidade.
                </TableCell>
              </TableRow>
            ) : (
              units.map((unit) => {
                const stats = unitStats?.[unit.id];
                return (
                  <TableRow key={unit.id}>
                    <TableCell className="pl-6 font-medium">{unit.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {unit.code || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {unit.city
                        ? `${unit.city}${unit.state ? `/${unit.state}` : ""}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {operatorsByUnit.get(unit.id) ?? 0}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {stats ? stats.sociosCount : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {stats ? (
                        stats.pendingReqCount > 0 ? (
                          <span className="font-medium text-amber-600 dark:text-amber-400">
                            {stats.pendingReqCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {unit.isActive ? (
                        <StatusBadge variant="success" label="Ativo" />
                      ) : (
                        <StatusBadge variant="secondary" label="Inativo" />
                      )}
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(unit)}
                          aria-label="Editar polo"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {unit.isActive && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => onEnter(unit)}
                          >
                            <LogIn className="h-3.5 w-3.5" />
                            Entrar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
