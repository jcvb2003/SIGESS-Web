import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { memberService } from '../../services/memberService'
import { memberQueryKeys } from '../../queryKeys'
import type { LocalityOption, StatusFilter, RgpStatusFilter } from '../../types/member.types'

export function useMemberFilters() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [localityFilter, setLocalityFilter] = useState('all')
  const [birthMonthFilter, setBirthMonthFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('all')
  const [rgpStatusFilter, setRgpStatusFilter] = useState<RgpStatusFilter>('all')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const localitiesQuery = useQuery<LocalityOption[]>({
    queryKey: memberQueryKeys.localities(),
    queryFn: () => memberService.getLocalities(),
    staleTime: 1000 * 60 * 10,
  })

  const clearFilters = () => {
    setStatusFilter('all')
    setLocalityFilter('all')
    setBirthMonthFilter('')
    setGenderFilter('all')
    setRgpStatusFilter('all')
  }

  return {
    statusFilter,
    setStatusFilter,
    localityFilter,
    setLocalityFilter,
    birthMonthFilter,
    setBirthMonthFilter,
    genderFilter,
    setGenderFilter,
    rgpStatusFilter,
    setRgpStatusFilter,
    isFiltersOpen,
    setIsFiltersOpen,
    clearFilters,
    localities: localitiesQuery.data ?? [],
    isLoadingLocalities: localitiesQuery.isLoading || localitiesQuery.isFetching,
  }
}
