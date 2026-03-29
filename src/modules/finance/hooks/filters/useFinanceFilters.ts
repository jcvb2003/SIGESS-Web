import { useCallback, useState } from "react";
import type { FinanceDashboardParams } from "../../types/finance.types";

const DEFAULT_PARAMS: FinanceDashboardParams = {
  page: 1,
  pageSize: 20,
  searchTerm: "",
  year: new Date().getFullYear(),
  tab: "todos",
};

export function useFinanceFilters() {
  const [params, setParams] = useState<FinanceDashboardParams>(DEFAULT_PARAMS);

  const setSearch = useCallback((searchTerm: string) => {
    setParams((prev) => ({ ...prev, searchTerm, page: 1 }));
  }, []);

  const setTab = useCallback((tab: FinanceDashboardParams["tab"]) => {
    setParams((prev) => ({ ...prev, tab, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  const setYear = useCallback((year: number) => {
    setParams((prev) => ({ ...prev, year, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setParams(DEFAULT_PARAMS);
  }, []);

  return {
    params,
    setSearch,
    setTab,
    setPage,
    setYear,
    resetFilters,
  };
}
