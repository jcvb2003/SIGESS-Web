import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import type { TenantMembershipRecord, TenantUnitRecord } from "@/modules/administration/services/administrationService";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

interface PolosBreakdownSectionProps {
  readonly units: TenantUnitRecord[];
  readonly memberships: TenantMembershipRecord[];
  readonly isLoading: boolean;
}

export function PolosBreakdownSection({
  units,
  memberships,
  isLoading,
}: PolosBreakdownSectionProps) {
  const operatorsByUnit = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of memberships) {
      if (m.unitId) {
        map.set(m.unitId, (map.get(m.unitId) ?? 0) + 1);
      }
    }
    return map;
  }, [memberships]);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Visao por polo
        </CardTitle>
        <CardDescription>
          Resumo operacional de cada polo da entidade.
        </CardDescription>
      </CardHeader>
      <CardContent className="border-t border-border/10 pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Polo</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Operadores</TableHead>
              <TableHead>Socios</TableHead>
              <TableHead>Req. pendentes</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Carregando polos...
                </TableCell>
              </TableRow>
            ) : units.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Nenhum polo cadastrado ainda.
                </TableCell>
              </TableRow>
            ) : (
              units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.name}</TableCell>
                  <TableCell>
                    {unit.city
                      ? `${unit.city}${unit.state ? `/${unit.state}` : ""}`
                      : "—"}
                  </TableCell>
                  <TableCell>{operatorsByUnit.get(unit.id) ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell>
                    <Badge variant={unit.isActive ? "default" : "secondary"}>
                      {unit.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
