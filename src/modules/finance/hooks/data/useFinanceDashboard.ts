import { useQuery } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { financeService } from "../../services/financeService";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import type { FinanceDashboardParams } from "../../types/finance.types";

export function useFinanceDashboard(params: FinanceDashboardParams) {
  const { unitId, bootstrapped } = useActiveScope();
  const query = useQuery({
    queryKey: financeQueryKeys.dashboard({ ...params, _unitId: unitId }),
    queryFn: () => financeService.getDashboard(params, unitId),
    staleTime: 0,
    enabled: bootstrapped && !!unitId,
  });

  return {
    members: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
