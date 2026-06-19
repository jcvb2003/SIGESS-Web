import { useQuery } from "@tanstack/react-query";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { coordinatorQueryKeys } from "../queryKeys";
import { coordinatorService } from "../services/coordinatorService";

export function useCoordinatorsData() {
  const { unitId, bootstrapped } = useActiveScope();

  const query = useQuery({
    queryKey: coordinatorQueryKeys.list(unitId),
    queryFn: async () => {
      if (!unitId) return [];
      const { data, error } = await coordinatorService.getCoordinators(unitId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: bootstrapped && !!unitId,
  });

  return {
    coordinators: query.data ?? [],
    isLoading: query.isLoading || query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
