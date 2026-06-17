import { useQuery } from "@tanstack/react-query";
import { settingsQueryKeys } from "@/modules/settings/queryKeys";
import { settingsService } from "@/modules/settings/services/settingsService";
import { Locality } from "@/modules/settings/types/settings.types";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

export function useLocalitiesData() {
  const { unitId, bootstrapped } = useActiveScope();

  const {
    data: localities,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: settingsQueryKeys.localities(unitId),
    queryFn: async () => {
      const response = await settingsService.getLocalities(unitId);
      if (response.error) throw response.error;
      return response.data || [];
    },
    staleTime: 30 * 60 * 1000,
    enabled: bootstrapped && !!unitId,
  });
  return {
    localities: (localities || []) as Locality[],
    loading: isLoading,
    refetch,
  };
}
