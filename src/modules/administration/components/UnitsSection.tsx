import { Building2, Edit, LogIn, MapPin } from "lucide-react";
import type { TenantUnitRecord } from "@/modules/administration/services/administrationService";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Switch } from "@/shared/components/ui/switch";

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
        <CardDescription>Crie, ajuste e ative os polos da entidade.</CardDescription>
      </CardHeader>

      <div className="px-6 pb-6">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando polos...</p>
        ) : units.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Comece criando o primeiro polo da entidade.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {units.map((unit) => (
              <div
                key={unit.id}
                className={`flex flex-col gap-3 rounded-xl border border-border/50 p-4 transition-opacity ${!unit.isActive ? "opacity-60" : ""}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-sm text-foreground">{unit.name}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {unit.code || "—"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={unit.isActive ? "default" : "secondary"} className="shrink-0">
                    {unit.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                {/* Localidade */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {unit.city
                      ? `${unit.city}${unit.state ? `/${unit.state}` : ""}`
                      : "Sem localidade"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30 mt-auto">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={unit.isActive}
                      onCheckedChange={() => onToggle(unit)}
                      disabled={isToggling}
                      aria-label={unit.isActive ? "Desativar polo" : "Ativar polo"}
                    />
                    <span className="text-xs text-muted-foreground">
                      {unit.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => onEdit(unit)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    {onEnter && unit.isActive && (
                      <Button type="button" variant="default" size="sm" className="gap-1.5 h-8" onClick={() => onEnter(unit)}>
                        <LogIn className="h-3.5 w-3.5" />
                        Entrar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
