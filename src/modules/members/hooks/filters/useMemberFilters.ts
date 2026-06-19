import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { localitiesService } from "@/modules/settings/services/localitiesService";
import { settingsQueryKeys } from "@/modules/settings/queryKeys";
import { usePortariaScope } from "@/shared/context/PortariaContext";
import { usePortariasData } from "../../hooks/data/usePortariasData";
import type {
  LocalityOption,
  StatusFilter,
  RgpStatusFilter,
} from "../../types/member.types";

export function useMemberFilters() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [localityFilter, setLocalityFilter] = useState("all");
  const [birthMonthFilter, setBirthMonthFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [rgpStatusFilter, setRgpStatusFilter] = useState<RgpStatusFilter>("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const { activePortariaId, setActivePortariaId } = usePortariaScope();

  // Tenant-wide por design: exibe localidades de todos os polos para filtrar sócios cross-unit
  const localitiesQuery = useQuery<LocalityOption[]>({
    queryKey: settingsQueryKeys.localities(),
    queryFn: async () => {
      const { data, error } = await localitiesService.getLocalities();
      if (error) throw error;
      return (data || []).map((item) => ({
        code: item.code ? String(item.code) : "",
        name: String(item.name ?? ""),
      }));
    },
  });

  const { portarias } = usePortariasData();

  // portariaFilter é derivado do contexto global para manter sincronia com o header
  const portariaFilter = activePortariaId ?? "all";
  const setPortariaFilter = (value: string) => {
    setActivePortariaId(value === "all" ? null : value);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setLocalityFilter("all");
    setBirthMonthFilter("");
    setGenderFilter("all");
    setRgpStatusFilter("all");
    setActivePortariaId(null);
  };

  return {
    statusFilter,
    setStatusFilter,
    localityFilter,
    setLocalityFilter,
    birthMonthFilter,
    setBirthMonthFilter,
    genderFilter,
    setGenderFilter,
    rgpStatusFilter,
    setRgpStatusFilter,
    portariaFilter,
    setPortariaFilter,
    isFiltersOpen,
    setIsFiltersOpen,
    clearFilters,
    localities: localitiesQuery.data ?? [],
    isLoadingLocalities: localitiesQuery.isLoading || localitiesQuery.isFetching,
    portarias,
  };
}
