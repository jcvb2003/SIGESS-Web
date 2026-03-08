import { useState } from "react";
import { RequirementStatus } from "../../types/requirement.types";

export type BeneficioFilterType = 'all' | 'recebido' | 'pendente';

export function useRequirementFilters() {
  const [statusFilter, setStatusFilter] = useState<RequirementStatus | 'all'>("all");
  const [beneficioFilter, setBeneficioFilter] = useState<BeneficioFilterType>("all");
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const clearFilters = () => {
    setStatusFilter("all");
    setBeneficioFilter("all");
    setYearFilter(new Date().getFullYear());
  };

  return {
    statusFilter,
    setStatusFilter,
    beneficioFilter,
    setBeneficioFilter,
    yearFilter,
    setYearFilter,
    isFiltersOpen,
    setIsFiltersOpen,
    clearFilters,
  };
}
