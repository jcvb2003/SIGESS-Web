import type {
  MemberFinancialSummary,
  FinancialStatusType,
  SituacaoFinanceiraSocio,
} from "../../types/finance.types";

/**
 * Transforma dados da view v_situacao_financeira_socio para o formato
 * consumido pela UI (MemberFinancialSummary).
 */
export function toMemberFinancialSummary(
  row: SituacaoFinanceiraSocio,
  currentYear: number,
  anoBase: number,
): MemberFinancialSummary {
  const isento = row.isento ?? false;
  const liberado = row.liberado_presidente ?? false;
  const anuidadesPagas = row.anuidades_pagas ?? [];

  const status = resolveStatus(isento, liberado, anuidadesPagas, currentYear, anoBase);

  return {
    cpf: row.cpf ?? "",
    nome: row.nome ?? "",
    situacaoAssociativa: row.situacao_associativa ?? "",
    regime: (row.regime as "anuidade" | "mensalidade") ?? "anuidade",
    isento,
    liberadoPresidente: liberado,
    anuidadesPagas,
    ultimoPagamento: row.ultimo_pagamento ?? null,
    status,
  };
}

function resolveStatus(
  isento: boolean,
  liberado: boolean,
  anuidadesPagas: number[],
  currentYear: number,
  anoBase: number,
): FinancialStatusType {
  if (isento) return "exempt";
  if (liberado) return "released";

  // Check if all years from anoBase to currentYear are paid
  for (let ano = anoBase; ano <= currentYear; ano++) {
    if (!anuidadesPagas.includes(ano)) return "overdue";
  }
  return "ok";
}
