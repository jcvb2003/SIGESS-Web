import { supabase } from "@/shared/lib/supabase/client";
import { ServiceResponse } from "@/shared/services/base/serviceResponse";
import type {
  DocumentListItem,
  DocumentSearchParams,
  DocumentsResult,
} from "../types/document.types";
const toNullableString = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
};
export const documentService = {
  async getRequestByMember(
    memberId: string,
  ): Promise<ServiceResponse<DocumentListItem>> {
    const { data, error } = await supabase
      .from("requerimentos")
      .select("id, cod_req_inss, data, codigo_do_socio, nome, cpf")
      .eq("codigo_do_socio", memberId)
      .order("data", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("Erro ao buscar requerimento por sócio:", error);
      return { data: null, error };
    }
    if (!data) return { data: null, error: null };
    return {
      data: {
        id: String(data.id),
        cod_req_inss: toNullableString(data.cod_req_inss),
        data: toNullableString(data.data),
        codigo_do_socio: toNullableString(data.codigo_do_socio),
        nome: toNullableString(data.nome),
        cpf: toNullableString(data.cpf),
      },
      error: null,
    };
  },
  async saveRequest(data: {
    codigo_do_socio: string;
    nome: string;
    cpf: string;
    data: string;
  }): Promise<ServiceResponse<DocumentListItem>> {
    const payload = {
      codigo_do_socio: data.codigo_do_socio,
      nome: data.nome,
      cpf: data.cpf,
      data: data.data,
    };
    const { data: savedData, error } = await supabase
      .from("requerimentos")
      .insert(payload)
      .select("id, cod_req_inss, data, codigo_do_socio, nome, cpf")
      .single();
    if (error) {
      console.error("Erro ao salvar requerimento:", error);
      return { data: null, error };
    }
    return {
      data: {
        id: String(savedData.id),
        cod_req_inss: toNullableString(savedData.cod_req_inss),
        data: toNullableString(savedData.data),
        codigo_do_socio: toNullableString(savedData.codigo_do_socio),
        nome: toNullableString(savedData.nome),
        cpf: toNullableString(savedData.cpf),
      },
      error: null,
    };
  },
  async deleteRequest(id: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase.from("requerimentos").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir requerimento:", error);
      return { data: null, error };
    }
    return { data: null, error: null };
  },
  async listRequests(
    params: DocumentSearchParams,
  ): Promise<ServiceResponse<DocumentsResult>> {
    const { page, pageSize, searchTerm } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from("requerimentos")
      .select("id, cod_req_inss, data, codigo_do_socio, nome, cpf", {
        count: "exact",
      });
    const term = searchTerm.trim();
    if (term) {
      const like = `%${term}%`;
      query = query.or(
        `nome.ilike.${like},cpf.ilike.${like},codigo_do_socio.ilike.${like},cod_req_inss.ilike.${like}`,
      );
    }
    const { data, error, count } = await query
      .order("data", { ascending: false })
      .range(from, to);
    if (error) {
      return { data: null, error };
    }
    const items = (data || []).map((item) => {
      const record = item as Record<string, unknown>;
      const mapped: DocumentListItem = {
        id: String(record.id),
        cod_req_inss: toNullableString(record.cod_req_inss),
        data: toNullableString(record.data),
        codigo_do_socio: toNullableString(record.codigo_do_socio),
        nome: toNullableString(record.nome),
        cpf: toNullableString(record.cpf),
      };
      return mapped;
    });
    return {
      data: {
        items,
        total: count ?? items.length,
      },
      error: null,
    };
  },
};
