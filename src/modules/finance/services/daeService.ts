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

    // 1. Busca o registro para verificar se faz parte de um grupo
    const { data: currentItem, error: fetchError } = await supabase
      .from("financeiro_dae")
      .select("grupo_id")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Define a query de atualização (individual ou por grupo)
    let query = supabase.from("financeiro_dae").update({ 
      status: "cancelado",
      cancelado_em: new Date().toISOString(),
      cancelado_por: user?.id ?? null,
      cancelamento_obs: observation
    });

    if (currentItem?.grupo_id) {
      query = query.eq("grupo_id", currentItem.grupo_id);
    } else {
      query = query.eq("id", id);
    }

    const { error: updateError } = await query;
    if (updateError) throw updateError;
  },

  /**
   * Busca todos os membros de um grupo específico.
   */
  async getGroupMembers(grupoId: string): Promise<FinanceDAE[]> {
    const { data, error } = await supabase
      .from("financeiro_dae")
      .select("*")
      .eq("grupo_id", grupoId)
      .order("competencia_mes", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Chama a RPC atômica para atualizar todos os meses de um grupo.
   */
  async updateGroupDAE(
    grupoId: string,
    year: number,
    items: { mes: number; valor: number }[]
  ): Promise<void> {
    const { error } = await supabase.rpc("update_dae_group", {
      p_grupo_id: grupoId,
      p_new_year: year,
      p_items: items,
    });

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
