import { useQuery } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { financeService } from "../../services/financeService";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

export function useFinanceStats(year: number, month: number) {
  const { unitId, bootstrapped } = useActiveScope();

  const query = useQuery({
    queryKey: financeQueryKeys.stats(year, month, unitId),
    queryFn: () => financeService.getMonthlyStats(year, month, unitId),
    staleTime: 0,
    enabled: bootstrapped && !!unitId,
  });

  return {
    arrecadado: query.data?.arrecadado ?? 0,
    arrecadadoAno: query.data?.arrecadadoAno ?? 0,
    qtdPagamentos: query.data?.qtdPagamentos ?? 0,
    daePendente: query.data?.daePendente ?? 0,
    isLoading: query.isLoading,
  };
}
