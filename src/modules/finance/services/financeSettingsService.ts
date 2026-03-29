import { supabase } from "@/shared/lib/supabase/client";
import type { FinanceSettings } from "../types/finance.types";

export const financeSettingsService = {
  async getSettings(): Promise<FinanceSettings> {
    const { data, error } = await supabase
      .from("parametros_financeiros")
      .select("*")
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  },

  async updateSettings(
    id: string,
    updates: Partial<FinanceSettings>,
  ): Promise<void> {
    const { error } = await supabase
      .from("parametros_financeiros")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
  },
};
