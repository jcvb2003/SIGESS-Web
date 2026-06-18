import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { settingsService } from "../services/settingsService";
import { SystemParameters } from "../types/settings.types";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

export function useParametersData() {
  const { unitId, tenantId, bootstrapped } = useActiveScope();
  const queryClient = useQueryClient();

  const parametersQuery = useQuery({
    queryKey: ["settings", "parameters", unitId ?? null],
    queryFn: async () => {
      const { data, error } = await settingsService.getParameters(unitId);
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60 * 1000,
    enabled: bootstrapped && !!unitId,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: SystemParameters) => {
      if (!unitId || !tenantId) throw new Error("Escopo inválido para salvar parâmetros.");
      const { data, error } = await settingsService.saveParameters(values, { unitId, tenantId });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["settings", "parameters", unitId ?? null], data);
      toast.success("Parâmetros salvos com sucesso.");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Erro ao salvar parâmetros.";
      toast.error(message);
    },
  });

  return {
    parameters: parametersQuery.data,
    isLoading: parametersQuery.isLoading,
    isSaving: saveMutation.isPending,
    error: parametersQuery.error,
    refetch: parametersQuery.refetch,
    saveParameters: (values: SystemParameters) =>
      saveMutation.mutateAsync(values),
  };
}
