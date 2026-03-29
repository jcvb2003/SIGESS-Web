import { useQuery } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { financialStatusService } from "../../services/financialStatusService";

export function useFinancialStatus(cpf: string | null, year: number) {
  const query = useQuery({
    queryKey: financeQueryKeys.financialStatus(cpf ?? "", year),
    queryFn: () => financialStatusService.isOverdue(cpf ?? "", year),
    enabled: !!cpf,
  });

  return {
    isOverdue: query.data ?? false,
    isLoading: query.isLoading,
    error: query.error,
  };
}
