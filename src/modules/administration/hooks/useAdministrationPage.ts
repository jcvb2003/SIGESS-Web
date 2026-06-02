import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";

function humanizeError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  if (msg.toLowerCase().includes("already been registered") || msg.toLowerCase().includes("already registered")) {
    return "Este e-mail ja esta cadastrado no sistema.";
  }
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

export function useAdministrationPage(enabled: boolean) {
  const { replaceUnits, setActiveUnit } = useTenantUnits();
  const queryClient = useQueryClient();

  // Dialog state
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<TenantUnitRecord | null>(null);

  // Queries
  const unitsQuery = useQuery({
    queryKey: administrationQueryKeys.tenantUnits(),
    queryFn: async () => {
      const { data, error } = await administrationService.listTenantUnits();
      if (error) throw error;
      return data ?? [];
    },
    enabled,
  });

  const tenantUsersQuery = useQuery({
    queryKey: administrationQueryKeys.tenantUsers(),
    queryFn: async () => {
      const { data, error } = await administrationService.listTenantUsers();
      if (error) throw error;
      return data ?? [];
    },
    enabled,
  });

  const membershipsQuery = useQuery({
    queryKey: administrationQueryKeys.tenantMemberships(),
    queryFn: async () => {
      const { data, error } = await administrationService.listTenantMemberships();
      if (error) throw error;
      return data ?? [];
    },
    enabled,
  });

  const totalMembersQuery = useQuery({
    queryKey: memberQueryKeys.count(null),
    queryFn: () => memberService.countMembers(),
    enabled,
  });

  const unitStatsQuery = useQuery({
    queryKey: administrationQueryKeys.unitStats(),
    queryFn: async () => {
      const { data, error } = await administrationService.listUnitStats();
      if (error) throw error;
      return data ?? {};
    },
    enabled,
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (values: TenantUnitInput) => {
      const { data, error } = await administrationService.saveTenantUnit(values);
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: administrationQueryKeys.tenantUnits() });
      toast.success("Polo salvo com sucesso.");
      setUnitDialogOpen(false);
      setEditingUnit(null);
    },
    onError: (error: unknown) => toast.error(humanizeError(error)),
  });

  const membershipCreateMutation = useMutation({
    mutationFn: async (values: TenantMembershipInput) => {
      const { data, error } = await administrationService.createTenantMembership(values);
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: administrationQueryKeys.tenantMemberships() });
      toast.success("Acesso criado com sucesso.");
    },
    onError: (error: unknown) => toast.error(humanizeError(error)),
  });

  const membershipDeleteMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await administrationService.deleteTenantMembership(membershipId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: administrationQueryKeys.tenantMemberships() });
      toast.success("Acesso removido com sucesso.");
    },
    onError: (error: unknown) => toast.error(humanizeError(error)),
  });

  const tenantUserCreateMutation = useMutation({
    mutationFn: async (values: TenantUserInput) => {
      const { data, error } = await administrationService.createTenantUser(values);
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: administrationQueryKeys.tenantUsers() });
      toast.success("Usuario vinculado a entidade com sucesso.");
    },
    onError: (error: unknown) => toast.error(humanizeError(error)),
  });

  const setTenantUserActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await administrationService.setTenantUserActive(id, isActive);
      if (error) throw error;
    },
    onSuccess: async (_data, { isActive }) => {
      await queryClient.invalidateQueries({ queryKey: administrationQueryKeys.tenantUsers() });
      toast.success(isActive ? "Operador ativado." : "Operador desativado.");
    },
    onError: (error: unknown) => toast.error(humanizeError(error)),
  });

  const deleteTenantUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await administrationService.deleteTenantUser(id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: administrationQueryKeys.tenantUsers() });
      toast.success("Operador removido.");
    },
    onError: (error: unknown) => toast.error(humanizeError(error)),
  });

  // Derived data
  const units = unitsQuery.data ?? [];
  const tenantUsers = tenantUsersQuery.data ?? [];
  const memberships = membershipsQuery.data ?? [];

  const activeUnitsCount = useMemo(() => units.filter((u) => u.isActive).length, [units]);
  const activeUsersCount = useMemo(() => tenantUsers.filter((u) => u.isActive).length, [tenantUsers]);
  const membershipsCount = useMemo(() => memberships.filter((m) => m.isActive).length, [memberships]);

  const membershipRows = useMemo(() => {
    const userMap = new Map(tenantUsers.map((u) => [u.userId, u]));
    const unitMap = new Map(units.map((u) => [u.id, u]));
    return memberships.map((m) => ({
      membership: m,
      user: userMap.get(m.userId) ?? (m.userName || m.userEmail
        ? {
            id: `membership-${m.id}`,
            tenantId: m.tenantId,
            userId: m.userId,
            email: m.userEmail ?? null,
            name: m.userName ?? null,
            tenantRole: "member",
            operatorType: m.operatorType ?? null,
            isActive: m.isActive,
          }
        : null),
      unit: m.unitId ? (unitMap.get(m.unitId) ?? null) : null,
    }));
  }, [memberships, tenantUsers, units]);

  // Dialog handlers
  const openCreateUnit = () => { setEditingUnit(null); setUnitDialogOpen(true); };
  const openEditUnit = (unit: TenantUnitRecord) => { setEditingUnit(unit); setUnitDialogOpen(true); };
  const closeUnitDialog = () => { setUnitDialogOpen(false); setEditingUnit(null); };

  const enterUnit = (unit: TenantUnitRecord) => {
    if (typeof globalThis !== "undefined") {
      globalThis.localStorage.setItem("last_activity_timestamp", Date.now().toString());
    }
    replaceUnits(
      units
        .filter((candidate) => candidate.isActive)
        .map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          code: candidate.code ?? null,
          tenantId: candidate.tenantId ?? null,
        })),
      unit.id,
    );
    setActiveUnit({ id: unit.id, name: unit.name, code: unit.code ?? null, tenantId: unit.tenantId ?? null });
    // Não navega explicitamente — TenantAdministrationLayout detecta !isStatePortal
    // e faz <Navigate replace /> sozinho, evitando dupla navegação que causava logout esporádico.
  };

  return {
    // Query state
    isLoading: {
      units: unitsQuery.isLoading,
      tenantUsers: tenantUsersQuery.isLoading,
      memberships: membershipsQuery.isLoading,
      unitStats: unitStatsQuery.isLoading,
    },

    // Data
    units,
    tenantUsers,
    memberships,
    membershipRows,
    unitStats: unitStatsQuery.data,
    totalMembers: totalMembersQuery.data?.count,

    // Counts
    counts: { activeUnits: activeUnitsCount, totalUnits: units.length, activeUsers: activeUsersCount, memberships: membershipsCount },

    // Dialog state
    unitDialog: { open: unitDialogOpen, editing: editingUnit },

    // Handlers
    openCreateUnit,
    openEditUnit,
    closeUnitDialog,
    enterUnit,

    // Mutations
    mutations: {
      saveUnit: { mutateAsync: saveMutation.mutateAsync, isPending: saveMutation.isPending },
      createMembership: { mutateAsync: membershipCreateMutation.mutateAsync, isPending: membershipCreateMutation.isPending },
      deleteMembership: { mutate: membershipDeleteMutation.mutate, isPending: membershipDeleteMutation.isPending },
      createTenantUser: { mutateAsync: tenantUserCreateMutation.mutateAsync, isPending: tenantUserCreateMutation.isPending },
      setTenantUserActive: { mutate: setTenantUserActiveMutation.mutate, isPending: setTenantUserActiveMutation.isPending },
      deleteTenantUser: { mutate: deleteTenantUserMutation.mutate, isPending: deleteTenantUserMutation.isPending },
    },
  };
}
