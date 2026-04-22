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
  row: any, // Temporariamente any até regenerar types
  currentYear: number,
  anoBase: number,
): MemberFinancialSummary {
  const isento = row.isento ?? false;
  const liberado = row.liberado_presidente ?? false;
  const anuidadesPagas = row.anuidades_pagas ?? [];
  const mesesPagosAtual = row.meses_pagos_atual ?? [];

  const status = resolveStatus(row.situacao_geral, isento, liberado, row.regime, anuidadesPagas, mesesPagosAtual, currentYear, anoBase);

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
  dbStatus: string | null,
  isento: boolean,
  liberado: boolean,
  regime: string,
  anuidadesPagas: number[],
  mesesPagosAtual: number[],
  currentYear: number,
  anoBase: number,
): FinancialStatusType {
  if (isento) return "exempt";
  if (liberado) return "released";

  // Se o banco já calculou 'EM_DIA', confiamos.
  if (dbStatus === "EM_DIA") return "ok";
  if (dbStatus === "EM_ATRASO") return "overdue";

  // Fallback para lógica legada/extra se necessário
  if (regime === "anuidade") {
    for (let ano = anoBase; ano <= currentYear; ano++) {
      if (!anuidadesPagas.includes(ano)) return "overdue";
    }
  } else if (regime === "mensalidade") {
    const currentMonth = new Date().getMonth() + 1;
    for (let mes = 1; mes <= currentMonth; mes++) {
      if (!mesesPagosAtual.includes(mes)) return "overdue";
    }
  }

  return "ok";
}
