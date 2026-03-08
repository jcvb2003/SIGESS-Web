import { useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { ErrorState } from './ErrorState'

export function RouteError() {
  const error = useRouteError()
  
  let message = 'Ocorreu um erro inesperado.'
  
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      message = 'Página não encontrada.'
    } else if (error.status === 401) {
      message = 'Você não tem permissão para acessar esta página.'
    } else {
      message = error.statusText || message
    }
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <ErrorState 
      title="Erro na aplicação"
      message={message}
      onRetry={() => window.location.reload()}
    />
  )
}
