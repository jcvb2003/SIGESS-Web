import { supabase } from "@/shared/lib/supabase/client";
import type { Json } from "@/shared/lib/supabase/database.types";
import type {
  FinanceDashboardParams,
  MemberFinancialSummary,
  PaymentSessionPayload,
  FinanceLancamento,
  FinanceLancamentoInsert,
  PaymentByPeriod,
} from "../types/finance.types";
import { toMemberFinancialSummary } from "./transformers/financeDataTransformer";

export interface FinanceDashboardResult {
  items: MemberFinancialSummary[];
  total: number;
}

// Captura o tipo exato do builder para a view, evitando erros de tipagem manual ou de sobrecarga
const _dashboardQuery = supabase.from("v_situacao_financeira_socio").select("*");
type DashboardQuery = typeof _dashboardQuery;

export const financeService = {
  /**
   * Busca dados do dashboard financeiro com filtros combinados.
   * Tab filtering é feito server-side para paginação correta.
   */
  async getDashboard(
    params: FinanceDashboardParams,
  ): Promise<FinanceDashboardResult> {
    const {
      page,
      pageSize,
      searchTerm,
      year,
      tab,
    } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const anoBase = params.anoBase ?? 2024;

    // Anos que precisam estar pagos para o sócio estar em dia
    const requiredYears: number[] = [];
    for (let y = anoBase; y <= year; y++) requiredYears.push(y);

    // Inadimplentes sem anos exigidos = ninguém deve nada
    if (tab === "inadimplentes" && requiredYears.length === 0) {
      return { items: [], total: 0 };
    }

    let query = supabase
      .from("v_situacao_financeira_socio")
      .select("*", { count: "exact" });

    if (searchTerm) {
      query = query.or(`nome.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`);
    }

    // Aplica filtros de tab e avançados
    query = this.applyDashboardFilters(query, params, requiredYears);

    query = query.order("nome", { ascending: true }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const items = (data ?? []).map((row) =>
      toMemberFinancialSummary(row, year, anoBase),
    );

    return { items, total: count ?? 0 };
  },

  /**
   * Helper para aplicar filtros de tab e avançados à query do dashboard.
   */
  applyDashboardFilters(
    query: DashboardQuery,
    params: FinanceDashboardParams,
    requiredYears: number[]
  ) {
    const { tab, filterAnnuityOk, filterAnnuityOverdue, filterExempt, filterReleased } = params;
    let filteredQuery = query;

    // Filtros de Tab
    if (tab === "isentos") {
      filteredQuery = filteredQuery.eq("isento", true);
    } else if (tab === "liberados") {
      filteredQuery = filteredQuery.eq("liberado_presidente", true);
    } else if (tab === "em-dia") {
      filteredQuery = filteredQuery
        .not("isento", "eq", true)
        .not("liberado_presidente", "eq", true);
      if (requiredYears.length > 0) {
        filteredQuery = filteredQuery.contains("anuidades_pagas", requiredYears);
      }
    } else if (tab === "inadimplentes") {
      filteredQuery = filteredQuery
        .not("isento", "eq", true)
        .not("liberado_presidente", "eq", true)
        .or(
          `anuidades_pagas.is.null,anuidades_pagas.not.cs.{${requiredYears.join(",")}}`,
        );
    }

    // Filtros Avançados
    if (filterAnnuityOk) {
      filteredQuery = filteredQuery
        .not("isento", "eq", true)
        .not("liberado_presidente", "eq", true);
      if (requiredYears.length > 0) {
        filteredQuery = filteredQuery.contains("anuidades_pagas", requiredYears);
      }
    }
    if (filterAnnuityOverdue) {
      filteredQuery = filteredQuery
        .not("isento", "eq", true)
        .not("liberado_presidente", "eq", true)
        .or(
          `anuidades_pagas.is.null,anuidades_pagas.not.cs.{${requiredYears.join(",")}}`,
        );
    }
    if (filterExempt) {
      filteredQuery = filteredQuery.eq("isento", true);
    }
    if (filterReleased) {
      filteredQuery = filteredQuery.eq("liberado_presidente", true);
    }

    return filteredQuery;
  },

  /**
   * Retorna contagens por aba para os badges do dashboard.
   */
  async getTabCounts(
    searchTerm: string,
    year: number,
    anoBase: number,
  ): Promise<Record<string, number>> {
    const { data, error } = await supabase.rpc("get_finance_tab_counts", {
      p_search_term: searchTerm,
      p_year: year,
      p_ano_base: anoBase,
    });
    if (error) throw error;
    return data as unknown as Record<string, number>;
  },

  /**
   * Retorna arrecadação do mês e DAE pendente para os SummaryCards.
   * DAE pendente = registros com status=pago mas boleto_pago=false.
   */
  async getMonthlyStats(
    year: number,
    month: number,
  ): Promise<{ arrecadado: number; arrecadadoAno: number; qtdPagamentos: number; daePendente: number }> {
    const firstDayMonth = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDayMonth = new Date(year, month, 0).toLocaleDateString("sv");
    const firstDayYear = `${year}-01-01`;
    const lastDayYear = `${year}-12-31`;

    const [lancamentosMes, lancamentosAno, daeResult] = await Promise.all([
      supabase
        .from("financeiro_lancamentos")
        .select("valor")
        .eq("status", "pago")
        .gte("data_pagamento", firstDayMonth)
        .lte("data_pagamento", lastDayMonth),
      supabase
        .from("financeiro_lancamentos")
        .select("valor")
        .eq("status", "pago")
        .gte("data_pagamento", firstDayYear)
        .lte("data_pagamento", lastDayYear),
      supabase
        .from("financeiro_dae")
        .select("id", { count: "exact", head: true })
        .eq("status", "pago")
        .eq("boleto_pago", false),
    ]);

    if (lancamentosMes.error) throw lancamentosMes.error;
    if (lancamentosAno.error) throw lancamentosAno.error;

    const arrecadado = (lancamentosMes.data ?? []).reduce(
      (sum, l) => sum + (Number(l.valor) || 0),
      0,
    );

    const arrecadadoAno = (lancamentosAno.data ?? []).reduce(
      (sum, l) => sum + (Number(l.valor) || 0),
      0,
    );

    return {
      arrecadado,
      arrecadadoAno,
      qtdPagamentos: lancamentosMes.data?.length ?? 0,
      daePendente: daeResult.count ?? 0,
    };
  },

  /**
   * Registra sessão de pagamento via RPC atômico.
   */
  async createPaymentSession(payload: PaymentSessionPayload): Promise<void> {
    const { error } = await supabase.rpc("register_payment_session", {
      p_socio_cpf: payload.socioCpf,
      p_sessao_id: payload.sessaoId,
      p_forma_pagamento: payload.paymentMethod,
      p_data_pagamento: payload.paymentDate,
      p_itens: payload.items as unknown as Json,
      p_daes: (payload.daes ?? []) as unknown as Json,
    });
    if (error) throw error;
  },

  /**
   * Busca extrato / lançamentos de um sócio.
   */
  async getMemberStatement(cpf: string): Promise<FinanceLancamento[]> {
    const { data, error } = await supabase
      .from("financeiro_lancamentos")
      .select("*")
      .eq("socio_cpf", cpf)
      .order("data_pagamento", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getPayment(id: string): Promise<FinanceLancamento> {
    const { data, error } = await supabase
      .from("financeiro_lancamentos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async createPayment(data: FinanceLancamentoInsert): Promise<void> {
    const { error } = await supabase
      .from("financeiro_lancamentos")
      .insert(data);

    if (error) throw error;
  },

  /**
   * Busca lançamentos por sessão (para comprovante).
   */
  async getSessionPayments(sessaoId: string): Promise<FinanceLancamento[]> {
    const { data, error } = await supabase
      .from("financeiro_lancamentos")
      .select("*")
      .eq("sessao_id", sessaoId)
      .eq("status", "pago");

    if (error) throw error;
    return data ?? [];
  },

  async getPaymentsByPeriod(
    startDate: string,
    endDate: string,
    page: number = 1,
    pageSize: number = 20,
    orderBy: "data_pagamento" | "created_at" = "data_pagamento"
  ): Promise<{ data: (PaymentByPeriod & { id: string })[]; total: number; totalAmount: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("financeiro_lancamentos")
      .select(`
        id,
        data_pagamento,
        tipo,
        competencia_ano,
        competencia_mes,
        forma_pagamento,
        valor,
        created_at,
        socios!inner (
          nome,
          cpf
        )
      `, { count: "exact" })
      .eq("status", "pago")
      .gte("data_pagamento", startDate)
      .lte("data_pagamento", endDate)
      .order(orderBy, { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Busca o valor total para o período (sem paginação)
    const { data: sumData } = await supabase
      .from("financeiro_lancamentos")
      .select("valor")
      .eq("status", "pago")
      .gte("data_pagamento", startDate)
      .lte("data_pagamento", endDate);

    const totalAmount =
      (sumData as { valor: number }[] | null)?.reduce(
        (acc, row) => acc + (Number(row.valor) || 0),
        0
      ) ?? 0;

    const mappedData = (data ?? []).map((row) => {
      const r = row as unknown as {
        id: string;
        data_pagamento: string;
        socios: { nome: string; cpf: string };
        tipo: string;
        competencia_ano: number;
        competencia_mes: number;
        forma_pagamento: string;
        valor: number;
      };
      return {
        id: r.id,
        data_pagamento: r.data_pagamento,
        nome: r.socios.nome,
        cpf: r.socios.cpf,
        tipo: r.tipo,
        competencia_ano: r.competencia_ano,
        competencia_mes: r.competencia_mes,
        forma_pagamento: r.forma_pagamento,
        valor: r.valor,
      };
    });

    return {
      data: mappedData,
      total: count ?? 0,
      totalAmount,
    };
  },

  /**
   * Cancela um lançamento (soft delete atômico via RPC).
   */
  async cancelPayment(id: string, observation: string): Promise<void> {
    const { error } = await supabase.rpc("cancel_payment_v1", {
      p_id: id,
      p_obs: observation,
    });

    if (error) throw error;
  },

  /**
   * ATENÇÃO: Uso restrito. Para edições auditáveis, use o fluxo Cancelar + Criar.
   * @deprecated Use o fluxo de substituição do useUpdateFinanceActions
   */
  async updatePayment(id: string, data: Partial<FinanceLancamento>): Promise<void> {
    const { error } = await supabase
      .from("financeiro_lancamentos")
      .update(data)
      .eq("id", id);

    if (error) throw error;
  },
};
