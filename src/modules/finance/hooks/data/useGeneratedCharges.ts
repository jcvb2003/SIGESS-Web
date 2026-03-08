import { useQuery } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { generatedChargesService } from "../../services/generatedChargesService";

export function useGeneratedCharges(typeId?: string) {
  const query = useQuery({
    queryKey: financeQueryKeys.generatedCharges(typeId),
    queryFn: () => generatedChargesService.getByType(typeId ?? ""),
    enabled: !!typeId,
  });

  return {
    charges: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
