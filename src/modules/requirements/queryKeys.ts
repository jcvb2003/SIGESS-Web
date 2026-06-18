import type { RequirementStatus } from "./types/requirement.types";

export const requirementQueryKeys = {
  all: ["requirements"] as const,
  list: (filters: {
    ano?: number;
    status?: RequirementStatus | 'all';
    beneficio_recebido?: boolean | 'all';
    searchTerm?: string;
    carenciaFilter?: string;
    page: number;
    pageSize: number;
    unitId?: string | null;
    enabled?: boolean;
  }) => [...requirementQueryKeys.all, "list", filters] as const,
  detail: (id: string) => [...requirementQueryKeys.all, "detail", id] as const,
  events: (id: string) => [...requirementQueryKeys.all, "events", id] as const,
};

