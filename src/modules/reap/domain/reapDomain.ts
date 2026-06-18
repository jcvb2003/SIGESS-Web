export type ReapStatus = "ok" | "parcial" | "pendente" | "problema";

/**
 * Calcula o status agregado de REAP (simplificado ou anual) a partir
 * de contagens e flag de problema. Função pura sem dependência de UI.
 */
export function calculateReapStatus(
  enviados: number,
  total: number,
  temProblema: boolean,
): ReapStatus {
  if (temProblema) return "problema";
  if (total > 0 && enviados === total) return "ok";
  if (enviados > 0) return "parcial";
  return "pendente";
}
