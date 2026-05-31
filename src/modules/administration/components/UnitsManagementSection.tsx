import { useMemo, useState } from "react";
import { Building2, Plus, Shield, UserCog } from "lucide-react";
import type { MembershipRow, UnitStat } from "@/modules/administration/types";
import type {
  TenantMembershipInput,
  TenantMembershipRecord,
  TenantUnitRecord,
  TenantUserInput,
  TenantUserRecord,
} from "@/modules/administration/services/administrationService";
import { Button } from "@/shared/components/ui/button";
import { CardDescription, CardTitle } from "@/shared/components/ui/card";
import { SectionCard, SectionCardHeader } from "@/shared/components/ui/SectionCard";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { OperatorsSheet } from "./OperatorsSheet";
import { UnitCard } from "./UnitCard";

interface UnitsManagementSectionProps {
  readonly units: TenantUnitRecord[];
  readonly tenantUsers: TenantUserRecord[];
  readonly membershipRows: MembershipRow[];
  readonly memberships: TenantMembershipRecord[];
  readonly unitStats?: Record<string, UnitStat>;
  readonly isLoading: boolean;
  readonly isDeleting: boolean;
  readonly isSavingMembership: boolean;
  readonly isSavingUser: boolean;
  readonly onEdit: (unit: TenantUnitRecord) => void;
  readonly onEnter: (unit: TenantUnitRecord) => void;
  readonly onCreate: () => void;
  readonly onDeleteMembership: (membershipId: string) => void;
  readonly onCreateMembership: (input: TenantMembershipInput) => Promise<void>;
  readonly onCreateUser: (input: TenantUserInput) => Promise<void>;
}

export function UnitsManagementSection({
  units,
  tenantUsers,
  membershipRows,
  memberships,
  unitStats,
  isLoading,
  isDeleting,
  isSavingMembership,
  isSavingUser,
  onEdit,
  onEnter,
  onCreate,
  onDeleteMembership,
  onCreateMembership,
  onCreateUser,
}: UnitsManagementSectionProps) {
  const [operatorsUnitId, setOperatorsUnitId] = useState<string | null>(null);

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

  const owners = useMemo(
    () => tenantUsers.filter((u) => u.tenantRole === "owner"),
    [tenantUsers],
  );

  const activeUnit = operatorsUnitId
    ? (units.find((u) => u.id === operatorsUnitId) ?? null)
    : null;

  return (
    <>
      <SectionCard>
        <SectionCardHeader>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Administração
            </CardTitle>
            <CardDescription>
              Gestores e configuração operacional dos polos da entidade.
            </CardDescription>
          </div>
          <Button onClick={onCreate} variant="outline" size="sm" className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Novo polo
          </Button>
        </SectionCardHeader>

        <Tabs defaultValue="polos" className="px-6 pb-6">
          <TabsList className="mb-4 h-9">
            <TabsTrigger value="gestores" className="text-xs gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Gestores
            </TabsTrigger>
            <TabsTrigger value="polos" className="text-xs gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Polos
            </TabsTrigger>
          </TabsList>

          {/* Tab: Gestores */}
          <TabsContent value="gestores" className="mt-0">
            {isLoading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Carregando...</p>
            ) : owners.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhum gestor cadastrado.
              </p>
            ) : (
              <div className="space-y-2">
                {owners.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-card px-4 py-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {(user.name || user.email || "?")
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{user.name || user.email}</p>
                      {user.email && user.name && (
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                    <StatusBadge
                      variant={user.isActive ? "success" : "secondary"}
                      label={user.isActive ? "Ativo" : "Inativo"}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Polos */}
          <TabsContent value="polos" className="mt-0">
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
                    operatorCount={rowsByUnit.get(unit.id)?.length ?? 0}
                    stats={unitStats?.[unit.id]}
                    onOperators={() => setOperatorsUnitId(unit.id)}
                    onEdit={() => onEdit(unit)}
                    onEnter={() => onEnter(unit)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SectionCard>

      {activeUnit && (
        <OperatorsSheet
          key={activeUnit.id}
          open={Boolean(operatorsUnitId)}
          onOpenChange={(o) => { if (!o) setOperatorsUnitId(null); }}
          unit={activeUnit}
          rows={rowsByUnit.get(activeUnit.id) ?? []}
          tenantUsers={tenantUsers}
          existingMemberships={memberships}
          isDeleting={isDeleting}
          isSavingMembership={isSavingMembership}
          isSavingUser={isSavingUser}
          onDeleteMembership={onDeleteMembership}
          onCreateMembership={onCreateMembership}
          onCreateUser={onCreateUser}
        />
      )}
    </>
  );
}
