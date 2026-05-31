import { useMemo, useState } from "react";
import { Building2, Plus, UserPlus } from "lucide-react";
import type { MembershipRow, UnitStat } from "@/modules/administration/types";
import type { TenantUnitRecord } from "@/modules/administration/services/administrationService";
import { Button } from "@/shared/components/ui/button";
import { CardDescription, CardTitle } from "@/shared/components/ui/card";
import { SectionCard, SectionCardHeader } from "@/shared/components/ui/SectionCard";
import { ConfirmDeleteMembershipDialog } from "./ConfirmDeleteMembershipDialog";
import { UnitCard } from "./UnitCard";

interface UnitsManagementSectionProps {
  readonly units: TenantUnitRecord[];
  readonly membershipRows: MembershipRow[];
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
    ? (membershipRows.find((r) => r.membership.id === pendingDeleteId) ?? null)
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
              {units.map((unit) => (
                <UnitCard
                  key={unit.id}
                  unit={unit}
                  rows={rowsByUnit.get(unit.id) ?? []}
                  stats={unitStats?.[unit.id]}
                  isDeleting={isDeleting}
                  onEdit={() => onEdit(unit)}
                  onEnter={() => onEnter(unit)}
                  onLinkOperator={() => onLinkOperator(unit.id)}
                  onDeleteRequest={setPendingDeleteId}
                />
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      <ConfirmDeleteMembershipDialog
        row={pendingRow}
        onConfirm={(id) => { onDeleteMembership(id); setPendingDeleteId(null); }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  );
}
