import { ANOS_SIMPLIFICADO, ANO_INICIAL_ANUAL, ANO_ATUAL } from "../types/reap.types";

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

/**
 * Retorna os anos aplicáveis ao membro com base na data de emissão do RGP.
 * Função pura sem dependência de UI — única fonte de verdade para o cálculo.
 *
 * type 'simplificado': anos de 2021-2024 filtrados pelo RGP
 * type 'anual': anos de 2025+ filtrados pelo RGP
 */
export function getApplicableYears(
  emissaoRgp: string | null,
  type: "simplificado" | "anual",
): number[] {
  // parseInt do prefixo YYYY evita o bug de timezone do Date constructor:
  // new Date('2023-01-01') é UTC midnight; em UTC-3 vira 2022-12-31 localmente.
  const anoRgp = emissaoRgp ? parseInt(emissaoRgp.substring(0, 4), 10) : null;

  if (type === "simplificado") {
    return ANOS_SIMPLIFICADO.filter((a) => !anoRgp || a >= anoRgp);
  }

  const start = anoRgp ? Math.max(anoRgp, ANO_INICIAL_ANUAL) : ANO_INICIAL_ANUAL;
  const years: number[] = [];
  for (let a = start; a <= ANO_ATUAL - 1; a++) years.push(a);
  return years;
}
