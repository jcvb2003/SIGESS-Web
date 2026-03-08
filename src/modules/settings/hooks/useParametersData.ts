import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { settingsService } from "../services/settingsService";
import { SystemParameters } from "../types/settings.types";
export function useParametersData() {
  const queryClient = useQueryClient();
  const parametersQuery = useQuery({
    queryKey: ["settings", "parameters"],
    queryFn: async () => {
      const { data, error } = await settingsService.getParameters();
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60 * 1000,
  });
  const saveMutation = useMutation({
    mutationFn: async (values: SystemParameters) => {
      const { data, error } = await settingsService.saveParameters(values);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["settings", "parameters"], data);
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
