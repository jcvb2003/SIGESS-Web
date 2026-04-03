import { useQuery } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { chargeTypesService } from "../../services/chargeTypesService";

export function useChargeTypes(activeOnly = false) {
  const query = useQuery({
    queryKey: financeQueryKeys.chargeTypes(),
    queryFn: () =>
      activeOnly
        ? chargeTypesService.getActive()
        : chargeTypesService.getAll(),
    staleTime: 30 * 60 * 1000, // 30 minutos
  });

  return {
    chargeTypes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
