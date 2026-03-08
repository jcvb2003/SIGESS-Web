import { useQuery } from "@tanstack/react-query";
import { financeQueryKeys } from "../../queryKeys";
import { financeService } from "../../services/financeService";
import { daeService } from "../../services/daeService";
import { generatedChargesService } from "../../services/generatedChargesService";
import type { FinanceLancamento, FinanceDAE, FinanceCharge } from "../../types/finance.types";

interface MemberStatementData {
  lancamentos: FinanceLancamento[];
  daes: FinanceDAE[];
  charges: FinanceCharge[];
}

export function useMemberStatement(cpf: string | null) {
  const query = useQuery({
    queryKey: financeQueryKeys.statement(cpf ?? ""),
    queryFn: async (): Promise<MemberStatementData> => {
      if (!cpf) return { lancamentos: [], daes: [], charges: [] };

      const [lancamentos, daes, charges] = await Promise.all([
        financeService.getMemberStatement(cpf),
        daeService.getMemberDAE(cpf),
        generatedChargesService.getBySocio(cpf),
      ]);

      return { lancamentos, daes, charges };
    },
    enabled: !!cpf,
  });

  return {
    lancamentos: query.data?.lancamentos ?? [],
    daes: query.data?.daes ?? [],
    charges: query.data?.charges ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
