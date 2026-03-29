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
  });

  return {
    chargeTypes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
