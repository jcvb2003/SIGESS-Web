import { useQuery } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { financeService } from "../../services/financeService";
import type { FinanceDashboardParams } from "../../types/finance.types";

export function useFinanceDashboard(params: FinanceDashboardParams) {
  const query = useQuery({
    queryKey: financeQueryKeys.dashboard(params),
    queryFn: () => financeService.getDashboard(params),
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
