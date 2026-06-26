import { useQuery } from "@tanstack/react-query";
import type { PaymentType } from "../../types/finance.types";
import { financeService } from "../../services/financeService";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

export function usePaymentsByPeriod(
  startDate: string,
  endDate: string,
  page: number = 1,
  pageSize: number = 20,
  orderBy: "data_pagamento" | "created_at" = "data_pagamento",
  searchTerm = "",
  selectedTypes?: PaymentType[],
) {
  const { unitId, bootstrapped, tenantId } = useActiveScope();

  return useQuery({
    queryKey: ["payments-by-period", startDate, endDate, page, pageSize, orderBy, searchTerm, selectedTypes, unitId],
    queryFn: () =>
      financeService.getPaymentsByPeriod(
        startDate,
        endDate,
        page,
        pageSize,
        orderBy,
        unitId,
        searchTerm,
        selectedTypes,
        tenantId,
      ),
    enabled: bootstrapped && !!unitId && !!startDate && !!endDate,
    staleTime: 0,
  });
}
