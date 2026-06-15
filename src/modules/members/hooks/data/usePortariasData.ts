import { useQuery } from "@tanstack/react-query";
import { settingsQueryKeys } from "@/modules/settings/queryKeys";
import { settingsService } from "@/modules/settings/services/settingsService";
import type { Portaria } from "@/modules/settings/types/settings.types";

export function usePortariasData(unitId?: string | null) {
  const {
    data: portarias,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: settingsQueryKeys.portarias(unitId),
    queryFn: async () => {
      const response = await settingsService.getPortarias(unitId);
      if (response.error) throw response.error;
      return response.data || [];
    },
    staleTime: 30 * 60 * 1000,
  });
  return {
    portarias: (portarias || []) as Portaria[],
    loading: isLoading,
    refetch,
  };
}
