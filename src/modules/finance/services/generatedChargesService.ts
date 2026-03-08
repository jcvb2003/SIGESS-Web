import { supabase } from "@/shared/lib/supabase/client";
import type { FinanceCharge } from "../types/finance.types";

export const generatedChargesService = {
  async getByType(typeId: string): Promise<FinanceCharge[]> {
    const { data, error } = await supabase
      .from("financeiro_cobrancas_geradas")
      .select("*")
      .eq("tipo_cobranca_id", typeId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getBySocio(cpf: string): Promise<FinanceCharge[]> {
    const { data, error } = await supabase
      .from("financeiro_cobrancas_geradas")
      .select("*, tipos_cobranca(nome, categoria)")
      .eq("socio_cpf", cpf)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Lançamento em massa via RPC atômico.
   * Nunca iterar sócios no frontend.
   */
  async launchBulk(chargeTypeId: string): Promise<number> {
    const { data, error } = await supabase.rpc("launch_bulk_contribution", {
      p_tipo_cobranca_id: chargeTypeId,
    });

    if (error) throw error;
    return data ?? 0;
  },

  async cancel(
    id: string,
    observation: string,
  ): Promise<void> {
    const { error } = await supabase
      .from("financeiro_cobrancas_geradas")
      .update({
        status: "cancelado",
        cancelado_em: new Date().toISOString(),
        cancelamento_obs: observation,
      })
      .eq("id", id);

    if (error) throw error;
  },
};
