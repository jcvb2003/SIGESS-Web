import { supabase } from "@/shared/lib/supabase/client";
import { resolveCurrentSharedTenantId } from "@/shared/utils/tenant";
import type { FinanceSettings } from "../types/finance.types";

export const financeSettingsService = {
  async getSettings(unitId?: string | null): Promise<FinanceSettings | null> {
    const sharedTenantId = await resolveCurrentSharedTenantId();
    const query = supabase.from("parametros_financeiros").select("*").limit(1);
    if (sharedTenantId) query.eq("tenant_id", sharedTenantId);
    if (unitId) query.eq("unit_id", unitId);
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
