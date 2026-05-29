import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AdministrationSummaryCards,
  MembershipDialog,
  MembershipsSection,
  PolosBreakdownSection,
  TenantUserDialog,
  TenantUsersSection,
  UnitDialog,
  UnitsSection,
} from "@/modules/administration/components";
import { administrationQueryKeys } from "@/modules/administration/queryKeys";
import {
  administrationService,
  type TenantMembershipInput,
  type TenantUnitInput,
  type TenantUnitRecord,
  type TenantUserInput,
} from "@/modules/administration/services/administrationService";
import { memberService } from "@/modules/members/services/memberService";
import { memberQueryKeys } from "@/modules/members/queryKeys";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { usePermissions } from "@/shared/hooks/usePermissions";

function humanizeError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  if (msg.includes("23505") || msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("already exists")) {
    return "Este registro ja existe.";
  }
  if (msg.toLowerCase().includes("foreign key") || msg.includes("23503")) {
    return "Nao e possivel concluir: ha registros vinculados.";
  }
  if (msg.toLowerCase().includes("network") || msg.toLowerCase().includes("fetch")) {
    return "Erro de conexao. Verifique sua internet e tente novamente.";
  }
  if (msg.toLowerCase().includes("jwt") || msg.toLowerCase().includes("auth")) {
    return "Sessao expirada. Faca login novamente.";
  }
  return msg || "Ocorreu um erro inesperado.";
}

export default function AdministrationPage() {
  const { canAccessTenantAdministration, isTenantAdministrationLoading } = usePermissions();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<TenantUnitRecord | null>(null);
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const [tenantUserDialogOpen, setTenantUserDialogOpen] = useState(false);

  const unitsQuery = useQuery({
    queryKey: administrationQueryKeys.tenantUnits(),
    queryFn: async () => {
      const { data, error } = await administrationService.listTenantUnits();
      if (error) throw error;
      return data ?? [];
    },
    enabled: canAccessTenantAdministration,
  });

  const tenantUsersQuery = useQuery({
    queryKey: administrationQueryKeys.tenantUsers(),
    queryFn: async () => {
      const { data, error } = await administrationService.listTenantUsers();
      if (error) throw error;
      return data ?? [];
    },
    enabled: canAccessTenantAdministration,
  });

  const membershipsQuery = useQuery({
    queryKey: administrationQueryKeys.tenantMemberships(),
    queryFn: async () => {
      const { data, error } = await administrationService.listTenantMemberships();
      if (error) throw error;
      return data ?? [];
    },
    enabled: canAccessTenantAdministration,
  });

  const totalMembersQuery = useQuery({
    queryKey: memberQueryKeys.count(null),
    queryFn: () => memberService.countMembers(),
    enabled: canAccessTenantAdministration,
  });

  const unitStatsQuery = useQuery({
    queryKey: administrationQueryKeys.unitStats(),
    queryFn: async () => {
      const { data, error } = await administrationService.listUnitStats();
      if (error) throw error;
      return data ?? {};
    },
    enabled: canAccessTenantAdministration,
  });

  const pendingRequirementsQuery = useQuery({
    queryKey: administrationQueryKeys.pendingRequirements(),
    queryFn: async () => {
      const { data, error } = await administrationService.countPendingRequirements();
      if (error) throw error;
      return data ?? 0;
    },
    enabled: canAccessTenantAdministration,
  });

  const defaultersQuery = useQuery({
    queryKey: administrationQueryKeys.defaulters(),
    queryFn: async () => {
      const { data, error } = await administrationService.countDefaulters();
      if (error) throw error;
      return data ?? 0;
    },
    enabled: canAccessTenantAdministration,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: TenantUnitInput) => {
      const { data, error } = await administrationService.saveTenantUnit(values);
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: administrationQueryKeys.tenantUnits(),
      });
      toast.success("Polo salvo com sucesso.");
      setDialogOpen(false);
      setEditingUnit(null);
    },
    onError: (error: unknown) => {
      toast.error(humanizeError(error));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (unit: TenantUnitRecord) => {
      const { error } = await administrationService.setTenantUnitActive(
        unit.id,
        !unit.isActive,
      );
      if (error) throw error;
    },
    onSuccess: async (_, unit) => {
      await queryClient.invalidateQueries({
        queryKey: administrationQueryKeys.tenantUnits(),
      });
      toast.success(
        unit.isActive ? "Polo desativado com sucesso." : "Polo ativado com sucesso.",
      );
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel atualizar o polo.",
      );
    },
  });

  const membershipCreateMutation = useMutation({
    mutationFn: async (values: TenantMembershipInput) => {
      const { data, error } = await administrationService.createTenantMembership(values);
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: administrationQueryKeys.tenantMemberships(),
      });
      toast.success("Acesso criado com sucesso.");
      setMembershipDialogOpen(false);
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel criar o acesso.",
      );
    },
  });

  const membershipDeleteMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await administrationService.deleteTenantMembership(membershipId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: administrationQueryKeys.tenantMemberships(),
      });
      toast.success("Acesso removido com sucesso.");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel remover o acesso.",
      );
    },
  });

  const tenantUserCreateMutation = useMutation({
    mutationFn: async (values: TenantUserInput) => {
      const { data, error } = await administrationService.createTenantUser(values);
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: administrationQueryKeys.tenantUsers(),
      });
      toast.success("Usuario vinculado a entidade com sucesso.");
      setTenantUserDialogOpen(false);
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel criar o usuario.",
      );
    },
  });

  const units = unitsQuery.data ?? [];
  const tenantUsers = tenantUsersQuery.data ?? [];
  const memberships = membershipsQuery.data ?? [];

  const activeUnitsCount = useMemo(
    () => units.filter((unit) => unit.isActive).length,
    [units],
  );
  const activeUsersCount = useMemo(
    () => tenantUsers.filter((user) => user.isActive).length,
    [tenantUsers],
  );
  const membershipsCount = useMemo(
    () => memberships.filter((membership) => membership.isActive).length,
    [memberships],
  );

  const membershipRows = useMemo(() => {
    const userMap = new Map(tenantUsers.map((user) => [user.userId, user]));
    const unitMap = new Map(units.map((unit) => [unit.id, unit]));

    return memberships.map((membership) => ({
      membership,
      user: userMap.get(membership.userId) ?? null,
      unit: membership.unitId ? (unitMap.get(membership.unitId) ?? null) : null,
    }));
  }, [memberships, tenantUsers, units]);

  if (isTenantAdministrationLoading) {
    return null;
  }

  if (!canAccessTenantAdministration) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Portal do Gestor"
        description="1. Crie os polos. 2. Adicione operadores a entidade. 3. Vincule operadores aos polos."
        actions={
          <Button
            onClick={() => {
              setEditingUnit(null);
              setDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo polo
          </Button>
        }
      />

      <AdministrationSummaryCards
        unitsCount={units.length}
        activeUnitsCount={activeUnitsCount}
        operatorsCount={activeUsersCount}
        accessCount={membershipsCount}
        totalMembers={totalMembersQuery.data?.count}
        pendingRequirements={pendingRequirementsQuery.data}
        defaulters={defaultersQuery.data}
      />

      <PolosBreakdownSection
        units={units}
        memberships={memberships}
        unitStats={unitStatsQuery.data}
        isLoading={unitsQuery.isLoading || membershipsQuery.isLoading || unitStatsQuery.isLoading}
      />

      <UnitsSection
        units={units}
        isLoading={unitsQuery.isLoading}
        isToggling={toggleMutation.isPending}
        onToggle={(unit) => toggleMutation.mutate(unit)}
        onEdit={(unit) => {
          setEditingUnit(unit);
          setDialogOpen(true);
        }}
      />

      <TenantUsersSection
        tenantUsers={tenantUsers}
        isLoading={tenantUsersQuery.isLoading}
        onCreate={() => setTenantUserDialogOpen(true)}
      />

      <MembershipsSection
        membershipRows={membershipRows}
        isLoading={membershipsQuery.isLoading}
        isDeleting={membershipDeleteMutation.isPending}
        onCreate={() => setMembershipDialogOpen(true)}
        onDelete={(membershipId) => membershipDeleteMutation.mutate(membershipId)}
      />

      <UnitDialog
        open={dialogOpen}
        onOpenChange={(nextOpen) => {
          setDialogOpen(nextOpen);
          if (!nextOpen) {
            setEditingUnit(null);
          }
        }}
        editingUnit={editingUnit}
        onSubmit={async (values) => {
          await saveMutation.mutateAsync(values);
        }}
        isSaving={saveMutation.isPending}
      />

      <MembershipDialog
        open={membershipDialogOpen}
        onOpenChange={setMembershipDialogOpen}
        users={tenantUsers.filter((user) => user.isActive)}
        units={units.filter((unit) => unit.isActive)}
        existingMemberships={memberships}
        onSubmit={async (values) => {
          await membershipCreateMutation.mutateAsync(values);
        }}
        isSaving={membershipCreateMutation.isPending}
      />

      <TenantUserDialog
        open={tenantUserDialogOpen}
        onOpenChange={setTenantUserDialogOpen}
        existingEmails={tenantUsers.map((u) => u.email ?? "").filter(Boolean)}
        onSubmit={async (values) => {
          await tenantUserCreateMutation.mutateAsync(values);
        }}
        isSaving={tenantUserCreateMutation.isPending}
      />
    </div>
  );
}
