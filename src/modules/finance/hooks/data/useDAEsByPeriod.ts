import { useQuery } from "@tanstack/react-query";
import { daeService } from "../../services/daeService";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

export function useDAEsByPeriod(
  startDate: string,
  endDate: string,
  page: number = 1,
  pageSize: number = 20,
  orderBy: "data_pagamento_boleto" | "created_at" = "data_pagamento_boleto",
) {
  const { unitId } = useActiveScope();

  return useQuery({
    queryKey: ["daes-by-period", startDate, endDate, page, pageSize, orderBy, unitId],
    queryFn: () => daeService.getDAEsByPeriod(startDate, endDate, page, pageSize, orderBy, unitId),
    enabled: !!startDate && !!endDate,
    staleTime: 0,
  });
}
