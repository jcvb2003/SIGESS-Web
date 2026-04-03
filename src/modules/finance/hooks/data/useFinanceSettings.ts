import { useQuery } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { financeSettingsService } from "../../services/financeSettingsService";

export function useFinanceSettings() {
  const query = useQuery({
    queryKey: financeQueryKeys.settings(),
    queryFn: () => financeSettingsService.getSettings(),
    staleTime: 30 * 60 * 1000, // 30 minutos
  });

  return {
    settings: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
