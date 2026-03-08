import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { settingsService } from '../services/settingsService'
import { Locality } from '../types/settings.types'

export function useLocalitiesData() {
  const [localities, setLocalities] = useState<Locality[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLocalities = useCallback(async () => {
    try {
      setLoading(true)
      const data = await settingsService.getLocalities()
      setLocalities(data)
    } catch (error) {
      console.error('Erro ao carregar localidades:', error)
      toast.error('Não foi possível carregar as localidades.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLocalities()
  }, [fetchLocalities])

  return {
    localities,
    loading,
    refetch: fetchLocalities
  }
}
