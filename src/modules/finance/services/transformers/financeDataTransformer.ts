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
  _currentYear: number,
  _anoBase: number,
): MemberFinancialSummary {
  const isento = row.isento ?? false;
  const liberado = row.liberado_presidente ?? false;
  const anuidadesPagas = row.anuidades_pagas ?? [];
  const mesesPagosAtual = row.meses_pagos_atual ?? [];

  const status = resolveStatus(row.situacao_geral, isento, liberado);

  return {
    cpf: row.cpf ?? "",
    nome: row.nome ?? "",
    situacaoAssociativa: row.situacao_associativa ?? "",
    regime: (row.regime as "anuidade" | "mensalidade") ?? "anuidade",
    isento,
    liberadoPresidente: liberado,
    anuidadesPagas,
    mesesPagosAtual,
    ultimoPagamento: row.ultimo_pagamento ?? null,
    status,
  };
}

// Gate confirmado 2026-06-18: situacao_geral nunca é null em dados reais
// (4/4 tenants, null_count = 0). Fallback TS removido — única fonte de verdade é o DB.
function resolveStatus(
  dbStatus: string | null,
  isento: boolean,
  liberado: boolean,
): FinancialStatusType {
  if (isento) return "exempt";
  if (liberado) return "released";
  if (dbStatus === "EM_DIA") return "ok";
  if (dbStatus === "EM_ATRASO") return "overdue";
  return "ok";
}
