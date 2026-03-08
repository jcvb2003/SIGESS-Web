import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { settingsService } from '../services/settingsService'
import { EntitySettings } from '../types/settings.types'

export function useEntityData() {
  const queryClient = useQueryClient()

  const entityQuery = useQuery({
    queryKey: ['settings', 'entity'],
    queryFn: () => settingsService.getEntity(),
    staleTime: 1000 * 60 * 5,
  })

  const saveMutation = useMutation({
    mutationFn: (values: EntitySettings) => settingsService.saveEntity(values),
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', 'entity'], data)
      toast.success('Dados da entidade salvos com sucesso.')
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Erro ao salvar dados da entidade.'
      toast.error(message)
    },
  })

  return {
    entity: entityQuery.data,
    isLoading: entityQuery.isLoading,
    isSaving: saveMutation.isPending,
    error: entityQuery.error,
    refetch: entityQuery.refetch,
    saveEntity: (values: EntitySettings) => saveMutation.mutateAsync(values),
  }
}
