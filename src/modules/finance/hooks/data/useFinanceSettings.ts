import { useQuery } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { financeSettingsService } from "../../services/financeSettingsService";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

export function useFinanceSettings() {
  const { unitId, tenantId, bootstrapped } = useActiveScope();

  const query = useQuery({
    queryKey: financeQueryKeys.settings(unitId),
    queryFn: () => financeSettingsService.getSettings({ unitId, tenantId }),
    staleTime: 30 * 60 * 1000,
    enabled: bootstrapped && !!unitId,
  });

  return {
    settings: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
