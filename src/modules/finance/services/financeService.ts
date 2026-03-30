import { supabase } from "@/shared/lib/supabase/client";
import type { Json } from "@/shared/lib/supabase/database.types";
import type {
  FinanceDashboardParams,
  MemberFinancialSummary,
  PaymentSessionPayload,
  FinanceLancamento,
} from "../types/finance.types";
import { toMemberFinancialSummary } from "./transformers/financeDataTransformer";

export interface FinanceDashboardResult {
  items: MemberFinancialSummary[];
  total: number;
}

export const financeService = {
  /**
   * Busca dados do dashboard financeiro com filtros combinados.
   */
  async getDashboard(
    params: FinanceDashboardParams,
  ): Promise<FinanceDashboardResult> {
    const { page, pageSize, searchTerm, year, tab } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Buscar parâmetros para o ano base
    const { data: settings } = await supabase
      .from("parametros_financeiros")
      .select("ano_base_cobranca")
      .limit(1)
      .single();

    const anoBase = settings?.ano_base_cobranca ?? 2024;

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
    }

    query = query.order("nome", { ascending: true }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const items = (data ?? [])
      .map((row) => toMemberFinancialSummary(row, year, anoBase))
      .filter((item) => {
        if (tab === "em-dia") return item.status === "ok";
        if (tab === "inadimplentes") return item.status === "overdue";
        return true;
      });

    return {
      items,
      total: count ?? 0,
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

  async createPayment(data: Partial<FinanceLancamento>): Promise<void> {
    const { error } = await supabase
      .from("financeiro_lancamentos")
      .insert(data as any);

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
    const { error } = await supabase
      .from("financeiro_lancamentos")
      .update({
        status: "cancelado",
        cancelado_em: new Date().toISOString(),
        cancelamento_obs: observation,
      })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Atualiza campos de um lançamento (Uso interno restrito ou legado). 
   * Para edições auditáveis, use o fluxo Cancelar + Criar.
   */
  async updatePayment(id: string, data: Partial<FinanceLancamento>): Promise<void> {
    const { error } = await supabase
      .from("financeiro_lancamentos")
      .update(data)
      .eq("id", id);

    if (error) throw error;
  },
};
