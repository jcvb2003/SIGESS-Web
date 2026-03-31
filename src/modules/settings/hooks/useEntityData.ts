import { useQuery } from "@tanstack/react-query";
import { settingsService } from "../services/settingsService";

export function useEntityData() {
  const entityQuery = useQuery({
    queryKey: ["settings", "entity"],
    queryFn: async () => {
      const { data, error } = await settingsService.getEntity();
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutos
  });

  return {
    entity: entityQuery.data,
    isLoading: entityQuery.isLoading,
    error: entityQuery.error,
    refetch: entityQuery.refetch,
  };
}
