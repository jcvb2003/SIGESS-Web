import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useRecentMembers() {
  return useQuery({
    queryKey: ['dashboard-recent-members'],
    queryFn: dashboardService.getRecentMembers,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useBirthdayMembers() {
  return useQuery({
    queryKey: ['dashboard-birthday-members'],
    queryFn: dashboardService.getBirthdayMembers,
    staleTime: 1000 * 60 * 60 * 24, // 24 horas (aniversário só muda dia a dia)
  })
}
