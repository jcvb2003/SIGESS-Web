import { useRouteError, isRouteErrorResponse } from "react-router-dom";
import { useEffect } from "react";
import { ErrorState } from "./ErrorState";

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("dynamically imported module") ||
    error.message.includes("Failed to fetch dynamically imported module") ||
    error.name === "ChunkLoadError"
  );
}

export function RouteError() {
  const error = useRouteError();

  useEffect(() => {
    if (isChunkLoadError(error)) {
      // Stale chunk after deploy — hard reload to get fresh assets
      window.location.reload();
    }
  }, [error]);

  let message = "Ocorreu um erro inesperado.";
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      message = "Página não encontrada.";
    } else if (error.status === 401) {
      message = "Você não tem permissão para acessar esta página.";
    } else {
      message = error.statusText || message;
    }
  } else if (error instanceof Error) {
    message = isChunkLoadError(error)
      ? "Atualizando aplicação..."
      : error.message;
  }
  return (
    <ErrorState
      title="Erro na aplicação"
      message={message}
      onRetry={() => window.location.reload()}
    />
  );
}
