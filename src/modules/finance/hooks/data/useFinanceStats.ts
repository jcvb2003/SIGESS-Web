import { useQuery } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { financeService } from "../../services/financeService";

export function useFinanceStats(year: number, month: number) {
  const query = useQuery({
    queryKey: financeQueryKeys.stats(year, month),
    queryFn: () => financeService.getMonthlyStats(year, month),
    staleTime: 0,
  });

  return {
    arrecadado: query.data?.arrecadado ?? 0,
    arrecadadoAno: query.data?.arrecadadoAno ?? 0,
    qtdPagamentos: query.data?.qtdPagamentos ?? 0,
    daePendente: query.data?.daePendente ?? 0,
    isLoading: query.isLoading,
  };
}
