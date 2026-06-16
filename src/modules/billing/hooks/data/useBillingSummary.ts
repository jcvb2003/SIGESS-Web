import { useQuery } from "@tanstack/react-query";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { getBillingSummary } from "../../services/billingSummaryService";
import { resolveTenantIdViaTenantUsers } from "@/shared/utils/tenant";

const billingQueryKeys = {
  summary: (tenantId: string | null) => ["billing", "summary", tenantId] as const,
};

export function useBillingSummary() {
  const { tenantId, bootstrapped } = useActiveScope();

  const query = useQuery({
    queryKey: billingQueryKeys.summary(tenantId),
    queryFn: async () => {
      const effectiveTenantId = tenantId ?? await resolveTenantIdViaTenantUsers();
      return getBillingSummary(effectiveTenantId);
    },
    enabled: bootstrapped,
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
