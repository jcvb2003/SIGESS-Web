import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { memberService } from "../../services/memberService";
import { settingsQueryKeys } from "@/modules/settings/queryKeys";
import { settingsService } from "@/modules/settings/services/settingsService";
import { usePortariaScope } from "@/shared/context/PortariaContext";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
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
  const { unitId, bootstrapped } = useActiveScope();

  const localitiesQuery = useQuery<LocalityOption[]>({
    queryKey: settingsQueryKeys.localities(),
    queryFn: () => memberService.getLocalities(),
  });

  const portariasQuery = useQuery({
    queryKey: settingsQueryKeys.portarias(unitId),
    queryFn: async () => {
      const response = await settingsService.getPortarias(unitId);
      if (response.error) throw response.error;
      return response.data || [];
    },
    staleTime: 30 * 60 * 1000,
    enabled: bootstrapped && !!unitId,
  });

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
    portarias: portariasQuery.data ?? [],
  };
}
