import { useQuery } from "@tanstack/react-query";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { externalChargeService } from "../../services/externalChargeService";

interface SummaryFilters {
  billingType?: string | null;
  mes?: number | null;
  ano?: number | null;
  search?: string;
}

export function useExternalChargesSummary(filters: SummaryFilters) {
  const { tenantId, unitId, bootstrapped } = useActiveScope();

  const { data } = useQuery({
    queryKey: ["finance", "external-charges-counts", tenantId, unitId, filters],
    queryFn: () => externalChargeService.getCounts(tenantId!, { unitId, ...filters }),
    enabled: bootstrapped && !!tenantId,
    staleTime: 30 * 1000,
  });

  return data ?? {};
}
