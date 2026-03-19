import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { settingsService } from "@/modules/settings/services/settingsService";
import type { EntitySettings } from "@/modules/settings/types/settings.types";
export function useEntityData() {
  const queryClient = useQueryClient();
  const entityQuery = useQuery({
    queryKey: ["settings", "entity"],
    queryFn: async () => {
      const { data, error } = await settingsService.getEntity();
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60 * 1000,
  });
  const saveMutation = useMutation({
    mutationFn: async (values: EntitySettings) => {
      const { data, error } = await settingsService.updateEntitySettings(values);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["settings", "entity"], data);
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
    entity: entityQuery.data,
    isLoading: entityQuery.isLoading,
    isSaving: saveMutation.isPending,
    error: entityQuery.error,
    refetch: entityQuery.refetch,
    saveEntity: (values: EntitySettings) => saveMutation.mutateAsync(values),
  };
}
