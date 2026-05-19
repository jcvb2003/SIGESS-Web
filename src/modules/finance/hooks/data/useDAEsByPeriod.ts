import { useQuery } from "@tanstack/react-query";
import { daeService } from "../../services/daeService";

export function useDAEsByPeriod(
  startDate: string,
  endDate: string,
  page: number = 1,
  pageSize: number = 20,
  orderBy: "data_pagamento_boleto" | "created_at" = "data_pagamento_boleto",
) {
  return useQuery({
    queryKey: ["daes-by-period", startDate, endDate, page, pageSize, orderBy],
    queryFn: () => daeService.getDAEsByPeriod(startDate, endDate, page, pageSize, orderBy),
    enabled: !!startDate && !!endDate,
    staleTime: 0,
  });
}
