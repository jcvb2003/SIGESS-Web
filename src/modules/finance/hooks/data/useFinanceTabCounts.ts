import { useQuery } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { financeService } from "../../services/financeService";

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
  anoBase: number,
) {
  const query = useQuery({
    queryKey: financeQueryKeys.tabCounts(searchTerm, year, anoBase),
    queryFn: () => financeService.getTabCounts(searchTerm, year, anoBase),
  });

  return {
    counts: query.data ?? EMPTY_COUNTS,
    isLoading: query.isLoading,
  };
}
