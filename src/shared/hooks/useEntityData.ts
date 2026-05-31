import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { settingsService } from "@/modules/settings/services/settingsService";
import type { EntitySettings } from "@/modules/settings/types/settings.types";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";

export function useEntityData() {
  const queryClient = useQueryClient();
  const { activeUnit } = useTenantUnits();
  const unitId = activeUnit?.id ?? null;

  const entityQuery = useQuery({
    queryKey: ["settings", "entity", unitId],
    queryFn: async () => {
      const { data, error } = await settingsService.getEntity(unitId);
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60 * 1000,
  });

  const tenantRootQuery = useQuery({
    queryKey: ["settings", "tenant-identity"],
    queryFn: () => settingsService.getTenantIdentity(),
    staleTime: 60 * 60 * 1000,
    enabled: unitId === null,
  });

  const entity = (() => {
    if (!entityQuery.data) return entityQuery.data;
    if (unitId !== null || !tenantRootQuery.data) return entityQuery.data;
    const root = tenantRootQuery.data;
    return { ...entityQuery.data, name: root.name, shortName: root.shortName, logoUrl: root.logoUrl };
  })();

  const saveMutation = useMutation({
    mutationFn: async (values: EntitySettings) => {
      const { data, error } = await settingsService.updateEntitySettings(values);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["settings", "entity", unitId], data);
      toast.success("Dados da entidade salvos com sucesso.");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Erro ao salvar dados da entidade.";
      toast.error(message);
    },
  });
  return {
    entity,
    isLoading: entityQuery.isLoading || (unitId === null && tenantRootQuery.isLoading),
    isSaving: saveMutation.isPending,
    error: entityQuery.error,
    refetch: entityQuery.refetch,
    saveEntity: (values: EntitySettings) => saveMutation.mutateAsync(values),
  };
}
