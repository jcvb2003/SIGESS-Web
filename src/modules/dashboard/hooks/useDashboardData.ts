import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";

export function useDashboardStats() {
  const { activeUnit } = useTenantUnits();
  const unitId = activeUnit?.id ?? null;
  return useQuery({
    queryKey: ["dashboard-stats", unitId],
    queryFn: () => dashboardService.getStats(unitId),
  });
}
export function useRecentMembers() {
  const { activeUnit } = useTenantUnits();
  const unitId = activeUnit?.id ?? null;
  return useQuery({
    queryKey: ["dashboard-recent-members", unitId],
    queryFn: () => dashboardService.getRecentMembers(unitId),
  });
}
export function useBirthdayMembers() {
  const { activeUnit } = useTenantUnits();
  const unitId = activeUnit?.id ?? null;
  return useQuery({
    queryKey: ["dashboard-birthday-members", unitId],
    queryFn: () => dashboardService.getBirthdayMembers(unitId),
  });
}
