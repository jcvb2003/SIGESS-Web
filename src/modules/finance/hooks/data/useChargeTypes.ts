import { useQuery } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { chargeTypesService } from "../../services/chargeTypesService";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

export function useChargeTypes(activeOnly = false) {
  const { unitId, bootstrapped } = useActiveScope();

  const query = useQuery({
    queryKey: financeQueryKeys.chargeTypes(unitId),
    queryFn: () =>
      activeOnly
        ? chargeTypesService.getActive(unitId)
        : chargeTypesService.getAll(unitId),
    staleTime: 30 * 60 * 1000,
    enabled: bootstrapped && !!unitId,
  });

  return {
    chargeTypes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
