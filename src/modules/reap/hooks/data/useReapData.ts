import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { reapService } from "../../services/reapService";
import { reapQueryKeys } from "../../queryKeys";
import { useReapFilters, ReapStatusFilter } from "../filters/useReapFilters";
import { useDataTableState } from "@/shared/hooks/useDataTableState";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";

export function useReapData(filters: {
  searchTerm?: string;
  page: number;
  pageSize: number;
  statusFilter?: string;
  unitId?: string | null;
}) {
  const query = useQuery({
    queryKey: reapQueryKeys.list(filters),
    queryFn: () => reapService.list(filters),
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

export function useReapDetail(cpf: string | null) {
  const query = useQuery({
    queryKey: cpf ? reapQueryKeys.detail(cpf) : [],
    queryFn: () => (cpf ? reapService.getByCpf(cpf) : null),
    enabled: !!cpf,
  });

  return {
    reap: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useReapListController() {
  const { activeUnit } = useTenantUnits();
  const {
    page, setPage,
    pageSize, setPageSize,
    searchTerm, debouncedTerm,
    setSearchTerm
  } = useDataTableState({ initialPageSize: 10 });

  const { statusFilter, setStatusFilter, isFiltersOpen, setIsFiltersOpen, clearFilters } =
    useReapFilters();

  const queryParams: Parameters<typeof useReapData>[0] = useMemo(
    () => ({
      page,
      pageSize,
      searchTerm: debouncedTerm,
      statusFilter,
      unitId: activeUnit?.id ?? null,
    }),
    [page, pageSize, debouncedTerm, statusFilter, activeUnit?.id]
  );

  const { members, total, isLoading, isFetching, error, refetch } = useReapData(queryParams);

  const totalPages = useMemo(() => {
    if (total === 0) return 1;
    return Math.ceil(total / pageSize);
  }, [total, pageSize]);

  const handleStatusFilterChange = (value: ReapStatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    clearFilters();
    setSearchTerm("");
    setPage(1);
  };

  return {
    search: {
      value: searchTerm,
      onChange: setSearchTerm,
      onOpenFilters: () => setIsFiltersOpen(true),
    },
    table: {
      members,
      isLoading,
      isFetching,
      error,
      refetch,
    },
    pagination: {
      total,
      page,
      pageSize,
      totalPages,
      isLoading,
      isFetching,
      onPageSizeChange: setPageSize,
      onPreviousPage: () => setPage(page - 1),
      onNextPage: () => setPage(page + 1),
    },
    filterPanel: {
      open: isFiltersOpen,
      onOpenChange: setIsFiltersOpen,
      statusFilter,
      onStatusChange: handleStatusFilterChange,
      onClear: handleClearFilters,
      onApply: () => setIsFiltersOpen(false),
    },
  };
}
