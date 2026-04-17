import { useQuery } from "@tanstack/react-query";
import { financeService } from "../../services/financeService";

export function usePaymentsByPeriod(
  startDate: string,
  endDate: string,
  page: number = 1,
  pageSize: number = 20
) {
  return useQuery({
    queryKey: ["payments-by-period", startDate, endDate, page, pageSize],
    queryFn: () => financeService.getPaymentsByPeriod(startDate, endDate, page, pageSize),
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
