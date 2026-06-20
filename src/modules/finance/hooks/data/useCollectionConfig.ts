import { useQuery } from "@tanstack/react-query";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { collectionConfigService } from "../../services/collectionConfigService";

export function useCollectionConfig() {
  const { tenantId, bootstrapped } = useActiveScope();

  const query = useQuery({
    queryKey: ["finance", "collection-config", tenantId ?? null],
    queryFn: () => collectionConfigService.getConfig(tenantId!),
    enabled: bootstrapped && !!tenantId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    config: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
