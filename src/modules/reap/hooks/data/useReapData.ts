import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reapService } from "../../services/reapService";
import { reapQueryKeys } from "../../queryKeys";
import { useReapSearch } from "../search/useReapSearch";
import { useReapFilters, ReapStatusFilter } from "../filters/useReapFilters";

export function useReapData(filters: {
  searchTerm?: string;
  page: number;
  pageSize: number;
  statusFilter?: string;
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

const DEFAULT_PAGE_SIZE = 10;

export function useReapListController() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const { searchTerm, setSearchTerm, handleSearchChange } = useReapSearch();
  const { statusFilter, setStatusFilter, isFiltersOpen, setIsFiltersOpen, clearFilters } =
    useReapFilters();

  const queryParams: Parameters<typeof useReapData>[0] = useMemo(
    () => ({
      page,
      pageSize,
      searchTerm,
      statusFilter,
    }),
    [page, pageSize, searchTerm, statusFilter]
  );

  const { members, total, isLoading, isFetching, error, refetch } = useReapData(queryParams);

  const totalPages = useMemo(() => {
    if (total === 0) return 1;
    return Math.ceil(total / pageSize);
  }, [total, pageSize]);

  const handleSearchValueChange = (value: string) => {
    handleSearchChange(value);
    setPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
  };

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
      onChange: handleSearchValueChange,
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
      onPageSizeChange: handlePageSizeChange,
      onPreviousPage: () => setPage((p) => Math.max(1, p - 1)),
      onNextPage: () => setPage((p) => (p < totalPages ? p + 1 : p)),
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
