import { useQuery } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { financeService } from "../../services/financeService";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

const EMPTY_COUNTS = {
  todos: 0,
  "em-dia": 0,
  inadimplentes: 0,
  liberados: 0,
  isentos: 0,
};

export function useFinanceTabCounts(
  searchTerm: string,
  year: number,
  anoBase: number | undefined,
) {
  const { unitId, bootstrapped } = useActiveScope();

  const query = useQuery({
    queryKey: financeQueryKeys.tabCounts(searchTerm, year, anoBase, unitId),
    queryFn: () => financeService.getTabCounts(searchTerm, year, anoBase!, unitId),
    staleTime: 60_000,
    enabled: bootstrapped && !!unitId && anoBase !== undefined,
  });

  return {
    counts: query.data ?? EMPTY_COUNTS,
    isLoading: query.isLoading,
  };
}
