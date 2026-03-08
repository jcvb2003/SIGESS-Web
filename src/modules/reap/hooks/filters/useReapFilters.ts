import { useState } from "react";

export type ReapStatusFilter = "todos" | "pendente" | "tem_problema" | "sem_reap";

const DEFAULT_STATUS_FILTER: ReapStatusFilter = "todos";

export function useReapFilters() {
  const [statusFilter, setStatusFilter] = useState<ReapStatusFilter>(DEFAULT_STATUS_FILTER);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const clearFilters = () => {
    setStatusFilter(DEFAULT_STATUS_FILTER);
  };

  return {
    statusFilter,
    setStatusFilter,
    isFiltersOpen,
    setIsFiltersOpen,
    clearFilters,
  };
}
