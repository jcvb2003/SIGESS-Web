import { supabase } from "@/shared/lib/supabase/client";
import { ServiceResponse } from "@/shared/services/base/serviceResponse";
import type { UnitWriteScope } from "@/shared/types/scope";
import type { Portaria } from "../types/settings.types";

const PORTARIAS_TABLE = "portarias";

async function getPortarias(unitId?: string | null): Promise<ServiceResponse<Portaria[]>> {
  let query = supabase
    .from(PORTARIAS_TABLE)
    .select("id, codigo_portaria, nome, is_active")
    .eq("is_active", true)
    .order("codigo_portaria", { ascending: true });
  if (unitId) query = query.eq("unit_id", unitId);
  const { data, error } = await query;
  if (error) {
    console.error("Erro ao buscar portarias:", error);
    return { data: null, error };
  }
  const portarias = (data || []).map((item) => ({
    id: String(item.id),
    codigoPortaria: String(item.codigo_portaria ?? ""),
    nome: String(item.nome ?? ""),
    isActive: Boolean(item.is_active),
  }));
  return { data: portarias, error: null };
}

async function savePortaria(portaria: Portaria, scope: UnitWriteScope): Promise<ServiceResponse<Portaria>> {
  const normalizedCodigo = portaria.codigoPortaria.trim().toUpperCase();
  const normalizedNome = portaria.nome.trim().toUpperCase();

  if (portaria.id) {
    const { data, error } = await supabase
      .from(PORTARIAS_TABLE)
      .update({
        codigo_portaria: normalizedCodigo,
        nome: normalizedNome,
        updated_at: new Date().toISOString(),
      })
      .eq("id", portaria.id)
      .select("id, codigo_portaria, nome, is_active")
      .single();
    if (error) {
      console.error("Erro ao atualizar portaria:", error);
      return { data: null, error };
    }
    return {
      data: {
        id: String(data.id),
        codigoPortaria: String(data.codigo_portaria ?? ""),
        nome: String(data.nome ?? ""),
        isActive: Boolean(data.is_active),
      },
      error: null,
    };
  }

  const { data, error } = await supabase
    .from(PORTARIAS_TABLE)
    .insert({
      codigo_portaria: normalizedCodigo,
      nome: normalizedNome,
      unit_id: scope.unitId,
      tenant_id: scope.tenantId,
    })
    .select("id, codigo_portaria, nome, is_active")
    .single();
  if (error) {
    console.error("Erro ao adicionar portaria:", error);
    return { data: null, error };
  }
  return {
    data: {
      id: String(data.id),
      codigoPortaria: String(data.codigo_portaria ?? ""),
      nome: String(data.nome ?? ""),
      isActive: Boolean(data.is_active),
    },
    error: null,
  };
}

async function deletePortaria(id: string): Promise<ServiceResponse<void>> {
  const { data, error } = await supabase
    .from(PORTARIAS_TABLE)
    .delete()
    .select("id")
    .eq("id", id);
  if (error) {
    console.error("Erro ao excluir portaria:", error);
    return { data: null, error };
  }
  if (!data || data.length === 0) {
    return {
      data: null,
      error: new Error("A portaria nao foi excluida. Verifique se seu perfil tem permissao para essa operacao."),
    };
  }
  return { data: null, error: null };
}

export const portariasService = { getPortarias, savePortaria, deletePortaria };
