import { toast } from "sonner";

export type GovBatchSessionItem = {
  cpf: string;
  senha: string;
  nome?: string;
  url: string;
};

export type GovBatchStatus =
  | "enfileirado"
  | "abrindo_sessao"
  | "aguardando_pagina"
  | "processando"
  | "concluido"
  | "erro"
  | "expirado"
  | "ignorado";

export type GovBatchStatusItem = {
  tabId: number;
  cpf: string;
  nome?: string;
  status: GovBatchStatus;
  statusTitle?: string;
  statusDescription?: string;
  progressStep?: number;
  progressTotal?: number;
  loginConcluido: boolean;
  lastError?: string;
  lastUpdatedAt?: number;
};

type ExtensionBridgeResponse = {
  success: boolean;
  error?: string;
  count?: number;
  total?: number;
  opened?: number;
  failed?: number;
  items?: GovBatchStatusItem[];
};

const EXTENSION_RESPONSE_TYPE = "SIGESS_EXTENSION_RESPONSE";

export function isFirefox(): boolean {
  return navigator.userAgent.toLowerCase().includes("firefox");
}

export function handleExternalLogin(
  url: string,
  cpf?: string,
  senha?: string,
  nome?: string,
  auditoriaData?: Record<string, unknown>,
): void {
  if (!cpf || !senha) {
    globalThis.open(url, "_blank");
    return;
  }

  if (!isFirefox()) {
    globalThis.open(url, "_blank");
    return;
  }

  try {
    globalThis.postMessage(
      {
        type: "abrirAbaContainer",
        url,
        cpf,
        senha,
        nome,
        auditoriaData,
      },
      globalThis.location.origin,
    );
  } catch (error) {
    console.error("Falha na comunicacao segura com a aba externa:", error);
    toast.error(
      "Nao foi possivel realizar o login automatico. Tente novamente ou use outro navegador.",
    );
  }
}

export async function enqueueGovBatchSessions(
  items: GovBatchSessionItem[],
): Promise<ExtensionBridgeResponse> {
  if (!isFirefox()) {
    return {
      success: false,
      error: "O envio em lote via extensao esta disponivel apenas no Firefox.",
    };
  }

  if (items.length === 0) {
    return {
      success: false,
      error: "Nenhum item valido foi informado para a fila GOV.",
    };
  }

  return requestExtension("enqueueGovBatchSessions", { items }, 12000, "A extensao nao respondeu ao envio do lote GOV.");
}

export async function getGovBatchStatuses(
  cpfs: string[],
): Promise<ExtensionBridgeResponse> {
  if (!isFirefox()) {
    return {
      success: false,
      error: "A consulta de status da extensao esta disponivel apenas no Firefox.",
    };
  }

  return requestExtension(
    "getGovBatchStatuses",
    { cpfs },
    8000,
    "A extensao nao respondeu Ã  consulta de status do lote GOV.",
  );
}

function requestExtension(
  type: string,
  payload: Record<string, unknown>,
  timeoutMs: number,
  timeoutError: string,
): Promise<ExtensionBridgeResponse> {
  return new Promise<ExtensionBridgeResponse>((resolve) => {
    const requestId = `gov-batch-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const cleanup = () => {
      globalThis.removeEventListener("message", onMessage);
      globalThis.clearTimeout(timeoutId);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== globalThis.location.origin) return;

      const data = event.data as
        | {
            type?: string;
            requestId?: string;
            response?: ExtensionBridgeResponse;
          }
        | undefined;

      if (data?.type !== EXTENSION_RESPONSE_TYPE || data.requestId !== requestId) {
        return;
      }

      cleanup();
      resolve(
        data.response ?? {
          success: false,
          error: "Resposta vazia da extensao.",
        },
      );
    };

    const timeoutId = globalThis.setTimeout(() => {
      cleanup();
      resolve({
        success: false,
        error: timeoutError,
      });
    }, timeoutMs);

    globalThis.addEventListener("message", onMessage);

    try {
      globalThis.postMessage(
        {
          type,
          requestId,
          ...payload,
        },
        globalThis.location.origin,
      );
    } catch (error) {
      cleanup();
      console.error("Falha na comunicacao segura com a extensao:", error);
      resolve({
        success: false,
        error: "Falha ao se comunicar com a extensao.",
      });
    }
  });
}
