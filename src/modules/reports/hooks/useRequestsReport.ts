
import { useQuery } from '@tanstack/react-query'
import { reportsService, RequestReportItem } from '../services/reportsService'
import { useMemo } from 'react'

export function useRequestsReport(searchTerm: string, enabled = true) {
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['requests-report'],
    queryFn: reportsService.fetchRequestsReport,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled
  })

  const filteredData = useMemo(() => {
    if (!searchTerm) return data
    
    const lowerTerm = searchTerm.toLowerCase()
    return data.filter((item: RequestReportItem) => 
      item.nome?.toLowerCase().includes(lowerTerm) ||
      item.cpf?.includes(lowerTerm) ||
      item.protocolo?.toString().includes(lowerTerm)
    )
  }, [data, searchTerm])

  return {
    data: filteredData,
    isLoading,
    error,
    refetch
  }
}
