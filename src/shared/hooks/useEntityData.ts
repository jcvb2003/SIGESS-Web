import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { settingsService } from "@/modules/settings/services/settingsService";
import type { EntitySettings } from "@/modules/settings/types/settings.types";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

export function useEntityData() {
  const queryClient = useQueryClient();
  const { unitId, tenantId } = useActiveScope();

  const entityQuery = useQuery({
    queryKey: ["settings", "entity", unitId],
    queryFn: async () => {
      const { data, error } = await settingsService.getEntity({ unitId, tenantId });
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

  const entity = useMemo(() => {
    if (!entityQuery.data) return entityQuery.data;
    if (unitId !== null || !tenantRootQuery.data) return entityQuery.data;
    const root = tenantRootQuery.data;
    return { ...entityQuery.data, name: root.name, shortName: root.shortName, logoUrl: root.logoUrl };
  }, [entityQuery.data, unitId, tenantRootQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (values: EntitySettings) => {
      if (!unitId || !tenantId) throw new Error("Escopo inválido para salvar entidade.");
      const { data, error } = await settingsService.updateEntitySettings(values, { unitId, tenantId });
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
