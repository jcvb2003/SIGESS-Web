import { useCallback, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { FinanceDashboardParams } from "../../types/finance.types";

const DEFAULT_PARAMS: FinanceDashboardParams = {
  page: 1,
  pageSize: 20,
  searchTerm: "",
  year: new Date().getFullYear(),
  tab: "todos",
  filterAnnuityOk: false,
  filterAnnuityOverdue: false,
  filterDAEPaid: false,
  filterDAEPending: false,
  filterContributionPending: false,
  filterGovRegistrationPending: false,
  filterReleased: false,
  filterExempt: false,
};

export function useFinanceFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getInitialParams = (): FinanceDashboardParams => {
    const search = searchParams.get("search") || "";
    return {
      ...DEFAULT_PARAMS,
      searchTerm: search,
      tab: (searchParams.get("tab") as FinanceDashboardParams["tab"]) || "todos",
      page: Number(searchParams.get("page")) || 1,
      year: Number(searchParams.get("year")) || new Date().getFullYear(),
    };
  };

  const [params, setParams] = useState<FinanceDashboardParams>(getInitialParams);

  // Sincronizar URL quando os parâmetros mudam (opcional, mas bom para UX)
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (params.searchTerm) newParams.set("search", params.searchTerm);
    else newParams.delete("search");
    
    if (params.tab !== "todos") newParams.set("tab", params.tab);
    else newParams.delete("tab");
    
    if (params.page !== 1) newParams.set("page", String(params.page));
    else newParams.delete("page");
    
    if (params.year !== new Date().getFullYear()) newParams.set("year", String(params.year));
    else newParams.delete("year");

    // Evitar loop infinito se os params forem iguais
    if (newParams.toString() !== searchParams.toString()) {
      setSearchParams(newParams, { replace: true });
    }
  }, [params.searchTerm, params.tab, params.page, params.year, setSearchParams, searchParams]);

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

  const applyAdvancedFilters = useCallback(
    (filters: {
      filterAnnuityOk: boolean;
      filterAnnuityOverdue: boolean;
      filterDAEPaid: boolean;
      filterDAEPending: boolean;
      filterContributionPending: boolean;
      filterGovRegistrationPending: boolean;
      filterReleased: boolean;
      filterExempt: boolean;
      year: number;
    }) => {
      setParams((prev) => ({ ...prev, ...filters, page: 1 }));
    },
    [],
  );

  const clearAdvancedFilters = useCallback(() => {
    setParams((prev) => ({
      ...prev,
      filterAnnuityOk: false,
      filterAnnuityOverdue: false,
      filterDAEPaid: false,
      filterDAEPending: false,
      filterContributionPending: false,
      filterGovRegistrationPending: false,
      filterReleased: false,
      filterExempt: false,
      page: 1,
    }));
  }, []);

  const hasActiveAdvancedFilters =
    params.filterAnnuityOk ||
    params.filterAnnuityOverdue ||
    params.filterDAEPaid ||
    params.filterDAEPending ||
    params.filterContributionPending ||
    params.filterGovRegistrationPending ||
    params.filterReleased ||
    params.filterExempt;

  const setPageSize = useCallback((pageSize: number) => {
    setParams((prev) => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setParams(DEFAULT_PARAMS);
  }, []);

  return {
    params,
    setSearch,
    setTab,
    setPage,
    setPageSize,
    setYear,
    applyAdvancedFilters,
    clearAdvancedFilters,
    hasActiveAdvancedFilters,
    resetFilters,
  };
}
