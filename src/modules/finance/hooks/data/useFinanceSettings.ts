import { useQuery } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { financeSettingsService } from "../../services/financeSettingsService";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";

export function useFinanceSettings() {
  const { activeUnit } = useTenantUnits();
  const unitId = activeUnit?.id ?? null;

  const query = useQuery({
    queryKey: financeQueryKeys.settings(unitId),
    queryFn: () => financeSettingsService.getSettings(unitId),
    staleTime: 30 * 60 * 1000,
  });

  return {
    settings: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
