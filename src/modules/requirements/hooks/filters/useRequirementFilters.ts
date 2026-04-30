import { useState } from "react";
import { RequirementStatus } from "../../types/requirement.types";

export type BeneficioFilterType = 'all' | 'recebido' | 'pendente';
export type CarenciaFilterType = 'all' | 'com_carencia' | 'sem_carencia';

export function useRequirementFilters() {
  const [statusFilter, setStatusFilter] = useState<RequirementStatus | 'all'>("all");
  const [beneficioFilter, setBeneficioFilter] = useState<BeneficioFilterType>("all");
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [carenciaFilter, setCarenciaFilter] = useState<CarenciaFilterType>("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const clearFilters = () => {
    setStatusFilter("all");
    setBeneficioFilter("all");
    setYearFilter(new Date().getFullYear());
    setCarenciaFilter("all");
  };

  return {
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
  };
}
