import { useQuery } from "@tanstack/react-query";
import { settingsQueryKeys } from "@/modules/settings/queryKeys";
import { settingsService } from "@/modules/settings/services/settingsService";
import { Locality } from "@/modules/settings/types/settings.types";

export function useLocalitiesData() {
  const {
    data: localities,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: settingsQueryKeys.localities(),
    queryFn: async () => {
      const response = await settingsService.getLocalities();
      if (response.error) throw response.error;
      return response.data || [];
    },
    staleTime: 30 * 60 * 1000,
  });
  return {
    localities: (localities || []) as Locality[],
    loading: isLoading,
    refetch,
  };
}
