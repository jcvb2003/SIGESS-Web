import { supabase } from "@/shared/lib/supabase/client";
import type { FinanceDAE, FinanceDAEInsert } from "../types/finance.types";

export const daeService = {
  async getMemberDAE(cpf: string): Promise<FinanceDAE[]> {
    const { data, error } = await supabase
      .from("financeiro_dae")
      .select("*")
      .eq("socio_cpf", cpf)
      .order("competencia_ano", { ascending: false })
      .order("competencia_mes", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getDAE(id: string): Promise<FinanceDAE> {
    const { data, error } = await supabase
      .from("financeiro_dae")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async createDAE(data: FinanceDAEInsert): Promise<void> {
    const { error } = await supabase
      .from("financeiro_dae")
      .insert(data);

    if (error) throw error;
  },

  async updateBoletoStatus(
    id: string,
    pago: boolean,
    dataPagamento?: string,
  ): Promise<void> {
    const { error } = await supabase
      .from("financeiro_dae")
      .update({
        boleto_pago: pago,
        data_pagamento_boleto: dataPagamento ?? null,
      })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Busca DAEs pagos em uma sessão específica (para comprovante).
   */
  async getSessionDAEs(sessaoId: string): Promise<FinanceDAE[]> {
    const { data, error } = await supabase
      .from("financeiro_dae")
      .select("*")
      .eq("sessao_id", sessaoId)
      .eq("status", "pago");

    if (error) throw error;
    return data ?? [];
  },

  async cancelDAE(id: string, observation: string = "Cancelado pelo operador"): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("financeiro_dae")
      .update({ 
        status: "cancelado",
        cancelado_em: new Date().toISOString(),
        cancelado_por: user?.id ?? null,
        cancelamento_obs: observation
      })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * ATENÇÃO: Uso restrito. Para edições auditáveis, use o fluxo Cancelar + Criar.
   * @deprecated Use o fluxo de substituição do useUpdateFinanceActions
   */
  async updateDAE(
    id: string, 
    data: Partial<FinanceDAE>
  ): Promise<void> {
    const { error } = await supabase
      .from("financeiro_dae")
      .update(data)
      .eq("id", id);

    if (error) throw error;
  },
};
