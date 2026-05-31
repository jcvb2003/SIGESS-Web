import { useMemo, useState } from "react";
import { Building2, Edit, Link2, LogIn, MapPin, Plus, Trash2, UserCog, UserPlus } from "lucide-react";
import type {
  TenantMembershipRecord,
  TenantUnitRecord,
  TenantUserRecord,
} from "@/modules/administration/services/administrationService";
import { Button } from "@/shared/components/ui/button";
import { CardDescription, CardTitle } from "@/shared/components/ui/card";
import { SectionCard, SectionCardHeader } from "@/shared/components/ui/SectionCard";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";

interface UnitStat {
  sociosCount: number;
  pendingReqCount: number;
}

interface MembershipRow {
  membership: TenantMembershipRecord;
  user: TenantUserRecord | null;
  unit: TenantUnitRecord | null;
}

interface UnitsManagementSectionProps {
  readonly units: TenantUnitRecord[];
  readonly memberships: TenantMembershipRecord[];
  readonly membershipRows: MembershipRow[];
  readonly tenantUsers: TenantUserRecord[];
  readonly unitStats?: Record<string, UnitStat>;
  readonly isLoading: boolean;
  readonly isDeleting: boolean;
  readonly onEdit: (unit: TenantUnitRecord) => void;
  readonly onEnter: (unit: TenantUnitRecord) => void;
  readonly onCreate: () => void;
  readonly onCreateUser: () => void;
  readonly onLinkOperator: (unitId: string) => void;
  readonly onDeleteMembership: (membershipId: string) => void;
}

export function UnitsManagementSection({
  units,
  memberships,
  membershipRows,
  unitStats,
  isLoading,
  isDeleting,
  onEdit,
  onEnter,
  onCreate,
  onCreateUser,
  onLinkOperator,
  onDeleteMembership,
}: UnitsManagementSectionProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const operatorsByUnit = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of memberships) {
      if (m.unitId) map.set(m.unitId, (map.get(m.unitId) ?? 0) + 1);
    }
    return map;
  }, [memberships]);

  const rowsByUnit = useMemo(() => {
    const map = new Map<string, MembershipRow[]>();
    for (const row of membershipRows) {
      if (!row.membership.unitId) continue;
      const existing = map.get(row.membership.unitId) ?? [];
      existing.push(row);
      map.set(row.membership.unitId, existing);
    }
    return map;
  }, [membershipRows]);

  const pendingRow = pendingDeleteId
    ? membershipRows.find((r) => r.membership.id === pendingDeleteId)
    : null;

  return (
    <>
      <SectionCard>
        <SectionCardHeader>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Polos
            </CardTitle>
            <CardDescription>
              Visao operacional e configuracao de cada polo da entidade.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={onCreateUser} variant="outline" size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Novo operador
            </Button>
            <Button onClick={onCreate} variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo polo
            </Button>
          </div>
        </SectionCardHeader>

        <div className="px-6 pb-6">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Carregando polos...</p>
          ) : units.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Comece criando o primeiro polo da entidade.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {units.map((unit) => {
                const stats = unitStats?.[unit.id];
                const operatorCount = operatorsByUnit.get(unit.id) ?? 0;
                const unitRows = rowsByUnit.get(unit.id) ?? [];

                return (
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
                          <p className="text-xs text-muted-foreground font-mono">{unit.code || "—"}</p>
                        </div>
                      </div>
                      <StatusBadge
                        variant={unit.isActive ? "success" : "secondary"}
                        label={unit.isActive ? "Ativo" : "Inativo"}
                      />
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

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-secondary/30 px-3 py-2">
                      <StatItem label="Operadores" value={operatorCount} />
                      <StatItem label="Sócios" value={stats?.sociosCount ?? "—"} />
                      <StatItem
                        label="Pendentes"
                        value={stats?.pendingReqCount ?? "—"}
                        highlight={typeof stats?.pendingReqCount === "number" && stats.pendingReqCount > 0}
                      />
                    </div>

                    {/* Operators list */}
                    {unitRows.length > 0 && (
                      <div className="space-y-1.5">
                        {unitRows.map(({ membership, user }) => (
                          <div
                            key={membership.id}
                            className={`flex items-center justify-between gap-2 rounded-md border border-border/40 bg-secondary/20 px-3 py-2 ${!membership.isActive ? "opacity-50" : ""}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <UserCog className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium">
                                  {user?.name || user?.email || membership.userId}
                                </p>
                                {user?.email && user.name && (
                                  <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                              disabled={isDeleting}
                              onClick={() => setPendingDeleteId(membership.id)}
                              aria-label="Remover acesso"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30 mt-auto">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-8"
                        onClick={() => onLinkOperator(unit.id)}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        Vincular
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onEdit(unit)}
                          aria-label="Editar polo"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        {unit.isActive && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5 h-8"
                            onClick={() => onEnter(unit)}
                          >
                            <LogIn className="h-3.5 w-3.5" />
                            Entrar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SectionCard>

      <AlertDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRow
                ? `Remover acesso de ${pendingRow.user?.name || "este operador"} ao polo ${pendingRow.unit?.name || "selecionado"}?`
                : "Confirma a remoção deste acesso?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDeleteId) {
                  onDeleteMembership(pendingDeleteId);
                  setPendingDeleteId(null);
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function StatItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-sm font-semibold tabular-nums ${highlight ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
        {value}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
