import { useQuery } from "@tanstack/react-query";
import type { PaymentType } from "../../types/finance.types";
import { financeService } from "../../services/financeService";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";

export function usePaymentsByPeriod(
  startDate: string,
  endDate: string,
  page: number = 1,
  pageSize: number = 20,
  orderBy: "data_pagamento" | "created_at" = "data_pagamento",
  searchTerm = "",
  selectedTypes?: PaymentType[],
) {
  const { activeUnit } = useTenantUnits();
  const unitId = activeUnit?.id ?? null;

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
      ),
    enabled: !!startDate && !!endDate,
    staleTime: 0,
  });
}
