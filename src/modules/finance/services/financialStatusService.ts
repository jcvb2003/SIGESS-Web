import { supabase } from "@/shared/lib/supabase/client";

export const financialStatusService = {
  /**
   * Verifica inadimplência via RPC SQL.
   * NUNCA reimplementar esta lógica no TypeScript.
   */
  async isOverdue(cpf: string, year: number): Promise<boolean> {
    const { data, error } = await supabase.rpc("socio_inadimplente_ano", {
      p_cpf: cpf,
      p_ano: year,
    });

    if (error) throw error;
    return data ?? false;
  },
};
