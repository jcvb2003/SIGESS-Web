import { useQuery } from "@tanstack/react-query";
import { entityService } from "../services/entityService";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

export function useEntityData() {
  const { unitId, tenantId } = useActiveScope();

  const entityQuery = useQuery({
    queryKey: ["settings", "entity", unitId],
    queryFn: async () => {
      const { data, error } = await entityService.getEntity({ unitId, tenantId });
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
