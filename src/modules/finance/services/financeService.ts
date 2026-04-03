import { supabase } from "@/shared/lib/supabase/client";
import type { Json } from "@/shared/lib/supabase/database.types";
import type {
  FinanceDashboardParams,
  MemberFinancialSummary,
  PaymentSessionPayload,
  FinanceLancamento,
  FinanceLancamentoInsert,
} from "../types/finance.types";
import { toMemberFinancialSummary } from "./transformers/financeDataTransformer";

export interface FinanceDashboardResult {
  items: MemberFinancialSummary[];
  total: number;
}

export const financeService = {
  /**
   * Busca dados do dashboard financeiro com filtros combinados.
   * Tab filtering é feito server-side para paginação correta.
   */
  async getDashboard(
    params: FinanceDashboardParams,
  ): Promise<FinanceDashboardResult> {
    const { page, pageSize, searchTerm, year, tab } = params;
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

    if (tab === "isentos") {
      query = query.eq("isento", true);
    } else if (tab === "liberados") {
      query = query.eq("liberado_presidente", true);
    } else if (tab === "em-dia") {
      query = query
        .not("isento", "eq", true)
        .not("liberado_presidente", "eq", true);
      if (requiredYears.length > 0) {
        query = query.contains("anuidades_pagas", requiredYears);
      }
    } else if (tab === "inadimplentes") {
      query = query
        .not("isento", "eq", true)
        .not("liberado_presidente", "eq", true)
        .or(
          `anuidades_pagas.is.null,anuidades_pagas.not.cs.{${requiredYears.join(",")}}`,
        );
    }

    query = query.order("nome", { ascending: true }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const items = (data ?? []).map((row) =>
      toMemberFinancialSummary(row, year, anoBase),
    );

    return { items, total: count ?? 0 };
  },

  /**
   * Retorna contagens por aba para os badges do dashboard.
   */
  async getTabCounts(
    searchTerm: string,
    year: number,
    anoBase: number,
  ): Promise<Record<string, number>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_finance_tab_counts', {
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

  /**
   * Cancela um lançamento (soft delete com audit trail).
   */
  async cancelPayment(id: string, observation: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("financeiro_lancamentos")
      .update({
        status: "cancelado",
        cancelado_em: new Date().toISOString(),
        cancelado_por: user?.id ?? null,
        cancelamento_obs: observation,
      })
      .eq("id", id);

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
