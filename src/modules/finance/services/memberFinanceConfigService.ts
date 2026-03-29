import { supabase } from "@/shared/lib/supabase/client";
import type { FinanceConfig } from "../types/finance.types";

export const memberFinanceConfigService = {
  async getConfig(cpf: string): Promise<FinanceConfig | null> {
    const { data, error } = await supabase
      .from("financeiro_config_socio")
      .select("*")
      .eq("cpf", cpf)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async upsertConfig(cpf: string, updates: Partial<FinanceConfig>): Promise<void> {
    const { error } = await supabase
      .from("financeiro_config_socio")
      .upsert({ cpf, ...updates }, { onConflict: "cpf" });

    if (error) throw error;
  },

  /**
   * Altera regime via RPC atômico.
   * Nunca fazer 2 chamadas separadas para config + histórico.
   */
  async updateRegime(
    cpf: string,
    newRegime: string,
    observation?: string,
  ): Promise<void> {
    const { error } = await supabase.rpc("update_member_regime", {
      p_cpf: cpf,
      p_novo_regime: newRegime,
      p_observacao: observation ?? undefined,
    });

    if (error) throw error;
  },
};
