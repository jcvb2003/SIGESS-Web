import { supabase } from "@/shared/lib/supabase/client";
import type { UnitReadScope } from "@/shared/types/scope";
import type { FinanceSettings } from "../types/finance.types";

export const financeSettingsService = {
  async getSettings(scope: UnitReadScope): Promise<FinanceSettings | null> {
    let query = supabase.from("parametros_financeiros").select("*").limit(1);
    if (scope.tenantId) query = query.eq("tenant_id", scope.tenantId);
    if (scope.unitId) query = query.eq("unit_id", scope.unitId);
    const { data, error } = await query.maybeSingle();

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
