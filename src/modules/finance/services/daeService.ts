import { supabase } from "@/shared/lib/supabase/client";
import type { FinanceDAE } from "../types/finance.types";

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

  async cancelDAE(id: string): Promise<void> {
    const { error } = await supabase
      .from("financeiro_dae")
      .update({ status: "cancelado" })
      .eq("id", id);

    if (error) throw error;
  },
};
