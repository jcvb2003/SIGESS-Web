import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { useActiveScope } from "@/shared/hooks/useActiveScope";

export function useDashboardStats() {
  const { unitId, bootstrapped } = useActiveScope();
  return useQuery({
    queryKey: ["dashboard-stats", unitId],
    queryFn: () => dashboardService.getStats(unitId),
    enabled: bootstrapped && !!unitId,
  });
}
export function useRecentMembers() {
  const { unitId, bootstrapped } = useActiveScope();
  return useQuery({
    queryKey: ["dashboard-recent-members", unitId],
    queryFn: () => dashboardService.getRecentMembers(unitId),
    enabled: bootstrapped && !!unitId,
  });
}
export function useBirthdayMembers() {
  const { unitId, bootstrapped, tenantId } = useActiveScope();
  return useQuery({
    queryKey: ["dashboard-birthday-members", unitId],
    queryFn: () => dashboardService.getBirthdayMembers(unitId, tenantId),
    enabled: bootstrapped && !!unitId,
  });
}
