import { useQuery } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { chargeTypesService } from "../../services/chargeTypesService";

export function useChargeTypes(activeOnly = false, unitId?: string | null) {
  const query = useQuery({
    queryKey: financeQueryKeys.chargeTypes(unitId),
    queryFn: () =>
      activeOnly
        ? chargeTypesService.getActive(unitId)
        : chargeTypesService.getAll(unitId),
    staleTime: 30 * 60 * 1000,
  });

  return {
    chargeTypes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
