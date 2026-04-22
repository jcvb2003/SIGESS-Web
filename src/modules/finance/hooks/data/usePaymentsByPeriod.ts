import { useQuery } from "@tanstack/react-query";
import { financeService } from "../../services/financeService";

export function usePaymentsByPeriod(
  startDate: string,
  endDate: string,
  page: number = 1,
  pageSize: number = 20,
  orderBy: "data_pagamento" | "created_at" = "data_pagamento"
) {
  return useQuery({
    queryKey: ["payments-by-period", startDate, endDate, page, pageSize, orderBy],
    queryFn: () => financeService.getPaymentsByPeriod(startDate, endDate, page, pageSize, orderBy),
    enabled: !!startDate && !!endDate,
    staleTime: 0,
  });
}
