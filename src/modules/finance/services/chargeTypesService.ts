import { supabase } from "@/shared/lib/supabase/client";
import { resolveTenantIdViaTenantUsers } from "@/shared/utils/tenant";
import type { ChargeType } from "../types/finance.types";

export const chargeTypesService = {
  async getAll(unitId?: string | null): Promise<ChargeType[]> {
    const query = supabase.from("tipos_cobranca").select("*").order("nome");
    if (unitId) query.eq("unit_id", unitId);
    const { data, error } = await query;

    if (error) throw error;
    return data ?? [];
  },

  async getActive(unitId?: string | null): Promise<ChargeType[]> {
    const query = supabase
      .from("tipos_cobranca")
      .select("*")
      .eq("ativo", true)
      .order("nome");
    if (unitId) query.eq("unit_id", unitId);
    const { data, error } = await query;

    if (error) throw error;
    return data ?? [];
  },

  async create(charge: Omit<ChargeType, "id" | "created_at" | "updated_at">, unitId?: string | null): Promise<void> {
    const sharedTenantId = await resolveTenantIdViaTenantUsers();
    const { error } = await supabase
      .from("tipos_cobranca")
      .insert({
        ...charge,
        ...(unitId ? { unit_id: unitId } : {}),
        ...(sharedTenantId ? { tenant_id: sharedTenantId } : {}),
      });

    if (error) throw error;
  },

  async update(id: string, updates: Partial<ChargeType>): Promise<void> {
    const { error } = await supabase
      .from("tipos_cobranca")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
  },

  async toggleActive(id: string, ativo: boolean): Promise<void> {
    const { error } = await supabase
      .from("tipos_cobranca")
      .update({ ativo })
      .eq("id", id);

    if (error) throw error;
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("tipos_cobranca")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
