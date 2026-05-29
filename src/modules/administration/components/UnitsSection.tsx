import { Building2, Edit, LogIn, ToggleLeft, ToggleRight } from "lucide-react";
import type { TenantUnitRecord } from "@/modules/administration/services/administrationService";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Switch } from "@/shared/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

interface UnitsSectionProps {
  readonly units: TenantUnitRecord[];
  readonly isLoading: boolean;
  readonly isToggling: boolean;
  readonly onToggle: (unit: TenantUnitRecord) => void;
  readonly onEdit: (unit: TenantUnitRecord) => void;
  readonly onEnter?: (unit: TenantUnitRecord) => void;
}

export function UnitsSection({
  units,
  isLoading,
  isToggling,
  onToggle,
  onEdit,
  onEnter,
}: UnitsSectionProps) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Polos
        </CardTitle>
        <CardDescription>
          Crie, ajuste e ative os polos da entidade.
        </CardDescription>
      </CardHeader>
      <CardContent className="border-t border-border/10 pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Polo</TableHead>
              <TableHead>Codigo</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Carregando polos...
                </TableCell>
              </TableRow>
            ) : units.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Comece criando o primeiro polo da entidade.
                </TableCell>
              </TableRow>
            ) : (
              units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.name}</TableCell>
                  <TableCell>{unit.code || "-"}</TableCell>
                  <TableCell>
                    {unit.city ? `${unit.city}${unit.state ? `/${unit.state}` : ""}` : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={unit.isActive ? "default" : "secondary"}>
                      {unit.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={unit.isActive}
                          onCheckedChange={() => onToggle(unit)}
                          disabled={isToggling}
                        />
                        {unit.isActive ? (
                          <ToggleRight className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => onEdit(unit)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {onEnter && unit.isActive && (
                        <Button
                          type="button"
                          variant="default"
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
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
