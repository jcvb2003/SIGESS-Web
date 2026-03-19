import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardService.getStats,
  });
}
export function useRecentMembers() {
  return useQuery({
    queryKey: ["dashboard-recent-members"],
    queryFn: dashboardService.getRecentMembers,
  });
}
export function useBirthdayMembers() {
  return useQuery({
    queryKey: ["dashboard-birthday-members"],
    queryFn: dashboardService.getBirthdayMembers,
  });
}
