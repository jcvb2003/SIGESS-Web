import { supabase } from "@/shared/lib/supabase/client";
import type { UnitWriteScope } from "@/shared/types/scope";
import type { ChargeType } from "../types/finance.types";

export const chargeTypesService = {
  async getAll(unitId?: string | null): Promise<ChargeType[]> {
    let query = supabase.from("tipos_cobranca").select("*").order("nome");
    if (unitId) query = query.eq("unit_id", unitId);
    const { data, error } = await query;

    if (error) throw error;
    return data ?? [];
  },

  async getActive(unitId?: string | null): Promise<ChargeType[]> {
    let query = supabase
      .from("tipos_cobranca")
      .select("*")
      .eq("ativo", true)
      .order("nome");
    if (unitId) query = query.eq("unit_id", unitId);
    const { data, error } = await query;

    if (error) throw error;
    return data ?? [];
  },

  async create(charge: Omit<ChargeType, "id" | "created_at" | "updated_at">, scope: UnitWriteScope): Promise<void> {
    const { error } = await supabase
      .from("tipos_cobranca")
      .insert({
        ...charge,
        unit_id: scope.unitId,
        tenant_id: scope.tenantId,
      });

    if (error) throw error;
  },

  async update(id: string, updates: Partial<ChargeType>): Promise<void> {
    // Remover undefined — Supabase JS pode convertê-los inesperadamente em null
    const clean = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    ) as Partial<ChargeType>;

    // Invariante do chk_obrigatoriedade: cadastro_governamental nunca pode ter obrigatoriedade
    if (clean.categoria === 'cadastro_governamental') {
      (clean as Record<string, unknown>).obrigatoriedade = null;
    }

    const { error } = await supabase
      .from("tipos_cobranca")
      .update(clean)
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
    const { data, error } = await supabase
      .from("tipos_cobranca")
      .delete()
      .select("id")
      .eq("id", id);

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("O tipo de cobranca nao foi excluido. Verifique se seu perfil tem permissao para essa operacao.");
    }
  },
};
