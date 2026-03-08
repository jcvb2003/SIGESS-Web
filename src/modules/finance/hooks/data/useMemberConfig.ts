import { useQuery } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { memberFinanceConfigService } from "../../services/memberFinanceConfigService";

export function useMemberConfig(cpf: string | null) {
  const query = useQuery({
    queryKey: financeQueryKeys.memberConfig(cpf ?? ""),
    queryFn: () => memberFinanceConfigService.getConfig(cpf!),
    enabled: !!cpf,
  });

  return {
    config: query.data ?? null,
    isLoading: query.isLoading,
  };
}
