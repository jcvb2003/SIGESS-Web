import { supabase } from "@/shared/lib/supabase/client";
import type { ChargeType } from "../types/finance.types";

export const chargeTypesService = {
  async getAll(): Promise<ChargeType[]> {
    const { data, error } = await supabase
      .from("tipos_cobranca")
      .select("*")
      .order("nome");

    if (error) throw error;
    return data ?? [];
  },

  async getActive(): Promise<ChargeType[]> {
    const { data, error } = await supabase
      .from("tipos_cobranca")
      .select("*")
      .eq("ativo", true)
      .order("nome");

    if (error) throw error;
    return data ?? [];
  },

  async create(charge: Omit<ChargeType, "id" | "created_at" | "updated_at">): Promise<void> {
    const { error } = await supabase
      .from("tipos_cobranca")
      .insert(charge);

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
