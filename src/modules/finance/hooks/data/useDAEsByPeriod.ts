import { useQuery } from "@tanstack/react-query";
import { daeService } from "../../services/daeService";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";

export function useDAEsByPeriod(
  startDate: string,
  endDate: string,
  page: number = 1,
  pageSize: number = 20,
  orderBy: "data_pagamento_boleto" | "created_at" = "data_pagamento_boleto",
) {
  const { activeUnit } = useTenantUnits();
  const unitId = activeUnit?.id ?? null;

  return useQuery({
    queryKey: ["daes-by-period", startDate, endDate, page, pageSize, orderBy, unitId],
    queryFn: () => daeService.getDAEsByPeriod(startDate, endDate, page, pageSize, orderBy, unitId),
    enabled: !!startDate && !!endDate,
    staleTime: 0,
  });
}
