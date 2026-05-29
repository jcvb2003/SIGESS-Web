import { useQuery } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { financeService } from "../../services/financeService";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";

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
  const { activeUnit } = useTenantUnits();
  const unitId = activeUnit?.id ?? null;

  const query = useQuery({
    queryKey: financeQueryKeys.tabCounts(searchTerm, year, anoBase, unitId),
    queryFn: () => financeService.getTabCounts(searchTerm, year, anoBase),
    staleTime: 0,
  });

  return {
    counts: query.data ?? EMPTY_COUNTS,
    isLoading: query.isLoading,
  };
}
