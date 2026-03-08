import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { requirementService } from "../../services/requirementService";
import { requirementQueryKeys } from "../../queryKeys";
import { useRequirementSearch } from "../search/useRequirementSearch";
import { useRequirementFilters, BeneficioFilterType } from "../filters/useRequirementFilters";
import { RequirementStatus } from "../../types/requirement.types";

export function useRequirementData(filters: {
  ano?: number;
  status?: RequirementStatus | 'all';
  beneficio_recebido?: boolean | 'all';
  searchTerm?: string;
  page: number;
  pageSize: number;
}) {
  const query = useQuery({
    queryKey: requirementQueryKeys.list(filters),
    queryFn: () => requirementService.list(filters),
  });

  return {
    requirements: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

const DEFAULT_PAGE_SIZE = 10;

export function useRequirementsListController() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const { searchTerm, setSearchTerm, handleSearchChange } = useRequirementSearch();
  const {
    statusFilter,
    setStatusFilter,
    beneficioFilter,
    setBeneficioFilter,
    yearFilter,
    setYearFilter,
    isFiltersOpen,
    setIsFiltersOpen,
    clearFilters,
  } = useRequirementFilters();

  const queryParams: Parameters<typeof useRequirementData>[0] = useMemo(
    () => ({
      page,
      pageSize,
      searchTerm,
      status: statusFilter,
      beneficio_recebido: beneficioFilter === 'all' ? 'all' : beneficioFilter === 'recebido',
      ano: yearFilter,
    }),
    [page, pageSize, searchTerm, statusFilter, beneficioFilter, yearFilter]
  );

  const { requirements, total, isLoading, isFetching, error, refetch } =
    useRequirementData(queryParams);

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

  const handleStatusFilterChange = (value: RequirementStatus | 'all') => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleYearFilterChange = (value: string) => {
    setYearFilter(Number(value));
    setPage(1);
  };

  const handleBeneficioFilterChange = (value: BeneficioFilterType) => {
    setBeneficioFilter(value);
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
      requirements,
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
      beneficioFilter,
      onBeneficioChange: handleBeneficioFilterChange,
      yearFilter,
      onYearChange: handleYearFilterChange,
      onClear: handleClearFilters,
      onApply: () => setIsFiltersOpen(false),
    },
  };
}
export function useRequirementDetail(id: string | null) {
  const requirementQuery = useQuery({
    queryKey: id ? requirementQueryKeys.detail(id) : [],
    queryFn: () => (id ? requirementService.getById(id) : null),
    enabled: !!id,
  });

  const eventsQuery = useQuery({
    queryKey: id ? requirementQueryKeys.events(id) : [],
    queryFn: () => (id ? requirementService.getEvents(id) : []),
    enabled: !!id,
  });

  return {
    requirement: requirementQuery.data,
    events: eventsQuery.data ?? [],
    isLoading: requirementQuery.isLoading || eventsQuery.isLoading,
    isFetching: requirementQuery.isFetching || eventsQuery.isFetching,
    error: requirementQuery.error || eventsQuery.error,
    refetch: () => {
      requirementQuery.refetch();
      eventsQuery.refetch();
    },
  };
}
