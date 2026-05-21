import type { GovBatchStatus, GovBatchStatusItem } from "@/shared/utils/browserDetection";

export function resolveStatusHeading(statusItem: GovBatchStatusItem): string {
  return (
    statusItem.statusTitle ||
    statusItem.statusDescription ||
    statusLabel(statusItem.status)
  );
}

export function statusLabel(status: GovBatchStatus): string {
  switch (status) {
    case "enfileirado":
      return "Enfileirado";
    case "abrindo_em_lote":
      return "Abrindo em lote";
    case "fazendo_login":
      return "Fazendo Login";
    case "acessando_esocial":
      return "Acessando o E-social";
    case "consultando":
      return "Consultando";
    case "verificando_boleto":
      return "Verificando boleto";
    case "boleto_salvo":
      return "Boleto salvo";
    case "gerando_pdf":
      return "Gerando PDF";
    case "redirecionando":
      return "Redirecionando";
    case "concluido":
      return "Concluido";
    case "erro":
      return "Erro";
    case "expirado":
      return "Expirado";
    case "ignorado":
      return "Ignorado";
    default:
      return status;
  }
}

export function statusTextClassName(status: GovBatchStatus): string {
  switch (status) {
    case "concluido":
      return "text-emerald-700";
    case "erro":
      return "text-red-700";
    case "fazendo_login":
    case "consultando":
      return "text-blue-700";
    case "abrindo_em_lote":
    case "acessando_esocial":
      return "text-amber-700";
    case "verificando_boleto":
    case "boleto_salvo":
    case "gerando_pdf":
    case "redirecionando":
      return "text-orange-700";
    default:
      return "text-muted-foreground";
  }
}

export function getStatusStepIndex(
  statusItem?: GovBatchStatusItem,
  fallbackTotal = 3,
): number {
  if (!statusItem) {
    return 0;
  }

  const explicitStep = Number(statusItem.progressStep);
  const explicitTotal = getStatusStepTotal(statusItem) || fallbackTotal;
  if (Number.isFinite(explicitStep) && explicitStep > 0) {
    return Math.max(0, Math.min(explicitTotal, explicitStep));
  }

  const status = statusItem.status;

  if (status === "concluido") {
    return 3;
  }

  if (
    status === "boleto_salvo" ||
    status === "gerando_pdf" ||
    status === "redirecionando"
  ) {
    return 3;
  }

  if (
    status === "acessando_esocial" ||
    status === "consultando" ||
    status === "verificando_boleto"
  ) {
    return 2;
  }

  if (
    status === "enfileirado" ||
    status === "abrindo_em_lote" ||
    status === "fazendo_login" ||
    status === "ignorado"
  ) {
    return 1;
  }

  if (status === "erro" || status === "expirado") {
    return 1;
  }

  return 0;
}

export function getStatusStepTotal(statusItem?: GovBatchStatusItem): number {
  const explicitTotal = Number(statusItem?.progressTotal);
  if (Number.isFinite(explicitTotal) && explicitTotal > 0) {
    return explicitTotal;
  }

  return 3;
}
