import { supabase } from "@/shared/lib/supabase/client";
import { ServiceResponse } from "@/shared/services/base/serviceResponse";
import type { UnitWriteScope } from "@/shared/types/scope";
import type { Locality } from "../types/settings.types";

const LOCALITIES_TABLE = "localidades";

async function getLocalities(unitId?: string | null): Promise<ServiceResponse<Locality[]>> {
  let query = supabase
    .from(LOCALITIES_TABLE)
    .select("id, nome, codigo_localidade")
    .order("nome", { ascending: true });
  if (unitId) query = query.eq("unit_id", unitId);
  const { data, error } = await query;
  if (error) {
    console.error("Erro ao buscar localidades:", error);
    return { data: null, error };
  }
  const localities = (data || []).map((item) => ({
    id: String(item.id),
    name: String(item.nome ?? ""),
    code: String(item.codigo_localidade ?? ""),
  }));
  return { data: localities, error: null };
}

async function saveLocality(locality: Locality, scope: UnitWriteScope): Promise<ServiceResponse<Locality>> {
  const normalizedName = locality.name.trim().toUpperCase();

  if (locality.id) {
    const { data, error } = await supabase
      .from(LOCALITIES_TABLE)
      .update({ nome: normalizedName || null })
      .eq("id", locality.id)
      .select("id, nome, codigo_localidade")
      .single();
    if (error) {
      console.error("Erro ao atualizar localidade:", error);
      return { data: null, error };
    }
    return {
      data: {
        id: String(data.id),
        name: String(data.nome ?? ""),
        code: String(data.codigo_localidade ?? ""),
      },
      error: null,
    };
  }

  const { data, error } = await supabase
    .from(LOCALITIES_TABLE)
    .insert({
      nome: normalizedName || null,
      unit_id: scope.unitId,
      tenant_id: scope.tenantId,
    })
    .select("id, nome, codigo_localidade")
    .single();
  if (error) {
    console.error("Erro ao adicionar localidade:", error);
    return { data: null, error };
  }
  return {
    data: {
      id: String(data.id),
      name: String(data.nome ?? ""),
      code: String(data.codigo_localidade ?? ""),
    },
    error: null,
  };
}

async function deleteLocality(id: string): Promise<ServiceResponse<void>> {
  const { data, error } = await supabase
    .from(LOCALITIES_TABLE)
    .delete()
    .select("id")
    .eq("id", id);
  if (error) {
    console.error("Erro ao excluir localidade:", error);
    return { data: null, error };
  }
  if (!data || data.length === 0) {
    return {
      data: null,
      error: new Error("A localidade nao foi excluida. Verifique se seu perfil tem permissao para essa operacao."),
    };
  }
  return { data: null, error: null };
}

export const localitiesService = { getLocalities, saveLocality, deleteLocality };
