import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { settingsService } from '../services/settingsService'
import { ParametersSettings } from '../types/settings.types'

export function useParametersData() {
  const queryClient = useQueryClient()

  const parametersQuery = useQuery({
    queryKey: ['settings', 'parameters'],
    queryFn: () => settingsService.getParameters(),
    staleTime: 1000 * 60 * 5,
  })

  const saveMutation = useMutation({
    mutationFn: (values: ParametersSettings) => settingsService.saveParameters(values),
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', 'parameters'], data)
      toast.success('Parâmetros salvos com sucesso.')
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Erro ao salvar parâmetros.'
      toast.error(message)
    },
  })

  return {
    parameters: parametersQuery.data,
    isLoading: parametersQuery.isLoading,
    isSaving: saveMutation.isPending,
    error: parametersQuery.error,
    refetch: parametersQuery.refetch,
    saveParameters: (values: ParametersSettings) => saveMutation.mutateAsync(values),
  }
}
