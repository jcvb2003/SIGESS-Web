import { useCallback, useState } from "react";
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

  const resetFilters = useCallback(() => {
    setParams(DEFAULT_PARAMS);
  }, []);

  return {
    params,
    setSearch,
    setTab,
    setPage,
    setYear,
    applyAdvancedFilters,
    clearAdvancedFilters,
    hasActiveAdvancedFilters,
    resetFilters,
  };
}
