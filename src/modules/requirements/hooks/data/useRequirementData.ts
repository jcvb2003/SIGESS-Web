import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { requirementService } from "../../services/requirementService";
import { requirementQueryKeys } from "../../queryKeys";
import { useRequirementFilters, BeneficioFilterType } from "../filters/useRequirementFilters";
import { RequirementStatus } from "../../types/requirement.types";
import { useDataTableState } from "@/shared/hooks/useDataTableState";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

export function useRequirementData(filters: {
  ano?: number;
  status?: RequirementStatus | 'all';
  beneficio_recebido?: boolean | 'all';
  searchTerm?: string;
  carenciaFilter?: string;
  page: number;
  pageSize: number;
  unitId?: string | null;
  enabled?: boolean;
}) {
  const query = useQuery({
    queryKey: requirementQueryKeys.list(filters),
    queryFn: () => requirementService.list(filters),
    enabled: filters.enabled !== false,
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

export function useRequirementsListController() {
  const { 
    page, setPage, 
    pageSize, setPageSize, 
    searchTerm, debouncedTerm, 
    setSearchTerm 
  } = useDataTableState({ initialPageSize: 10 });

  const {
    statusFilter,
    setStatusFilter,
    beneficioFilter,
    setBeneficioFilter,
    yearFilter,
    setYearFilter,
    carenciaFilter,
    setCarenciaFilter,
    isFiltersOpen,
    setIsFiltersOpen,
    clearFilters,
  } = useRequirementFilters();

  const { unitId, bootstrapped } = useActiveScope();

  const queryParams: Parameters<typeof useRequirementData>[0] = useMemo(
    () => ({
      page,
      pageSize,
      searchTerm: debouncedTerm,
      status: statusFilter,
      beneficio_recebido: beneficioFilter === 'all' ? 'all' : beneficioFilter === 'recebido',
      ano: yearFilter,
      carenciaFilter: carenciaFilter,
      unitId,
      enabled: bootstrapped,
    }),
    [page, pageSize, debouncedTerm, statusFilter, beneficioFilter, yearFilter, carenciaFilter, unitId, bootstrapped]
  );

  const { requirements, total, isLoading, isFetching, error, refetch } =
    useRequirementData(queryParams);

  const totalPages = useMemo(() => {
    if (total === 0) return 1;
    return Math.ceil(total / pageSize);
  }, [total, pageSize]);

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

  const handleCarenciaFilterChange = (value: string) => {
    setCarenciaFilter(value as Parameters<typeof setCarenciaFilter>[0]);
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
      onPageSizeChange: setPageSize,
      onPreviousPage: () => setPage(page - 1),
      onNextPage: () => setPage(page + 1),
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
      carenciaFilter,
      onCarenciaChange: handleCarenciaFilterChange,
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
