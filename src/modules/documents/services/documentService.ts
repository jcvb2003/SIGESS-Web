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
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
};
export const documentService = {
  async getRequestByMember(
    memberId: string,
  ): Promise<ServiceResponse<DocumentListItem>> {
    const { data, error } = await supabase
      .from("requerimentos")
      .select("id, cod_req, data, cpf, socios!inner(nome, codigo_do_socio)")
      .eq("cpf", memberId) // Nota: codigo_do_socio mudou para cpf ser a FK base? Espera, o memberId vindo era o codigo_do_socio ou CPF? O frontend passava memberId. Se era memberId = CPF, OK. Vou verificar na assinatura.
      .order("data", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar requerimento por sócio:", error);
      return { data: null, error };
    }

    if (!data) return { data: null, error: null };

    // Hack de tipagem para ler do recurso embedado
    const sociosObj = data.socios as unknown as { nome?: string; codigo_do_socio?: string } | null;

    return {
      data: {
        id: String(data.id),
        cod_req: toNullableString(data.cod_req),
        data: toNullableString(data.data),
        codigo_do_socio: toNullableString(sociosObj?.codigo_do_socio),
        nome: toNullableString(sociosObj?.nome),
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
    const toNullable = (val: string) => val?.trim() || null;
    const payload = {
      cpf: toNullable(data.cpf),
      data: toNullable(data.data),
    };

    const { data: savedData, error } = await supabase
      .from("requerimentos")
      .insert(payload)
      .select("id, cod_req, data, cpf, socios!inner(nome, codigo_do_socio)")
      .single();

    if (error) {
      console.error("Erro ao salvar requerimento:", error);
      return { data: null, error };
    }

    const sociosObj = savedData.socios as unknown as { nome?: string; codigo_do_socio?: string } | null;

    return {
      data: {
        id: String(savedData.id),
        cod_req: toNullableString(savedData.cod_req),
        data: toNullableString(savedData.data),
        codigo_do_socio: toNullableString(sociosObj?.codigo_do_socio),
        nome: toNullableString(sociosObj?.nome),
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
      .select("id, cod_req, data, cpf, socios!inner(nome, codigo_do_socio)", {
        count: "exact",
      });

    const term = searchTerm.trim();
    if (term) {
      const like = `%${term}%`;
      // Precisamos buscar nomes ou códigos de socio na tabela socios
      const { data: matchedSocios } = await supabase
        .from("socios")
        .select("cpf")
        .or(`nome.ilike.${like},codigo_do_socio.ilike.${like}`)
        .limit(100);
      
      const cpfs = matchedSocios?.map((s) => s.cpf) || [];
      
      if (cpfs.length > 0) {
        // Formata os cpfs para string escapada, evitando nested template literals.
        const cpfsInQuery = cpfs.map((c) => '"' + c + '"').join(',');
        query = query.or(`cpf.ilike.${like},cod_req.ilike.${like},cpf.in.(${cpfsInQuery})`);
      } else {
        query = query.or(`cpf.ilike.${like},cod_req.ilike.${like}`);
      }
    }

    const { data, error, count } = await query
      .order("data", { ascending: false })
      .range(from, to);

    if (error) {
      return { data: null, error };
    }

    const items = (data || []).map((item) => {
      const record = item as Record<string, unknown>;
      const sociosObj = record.socios as { nome?: string; codigo_do_socio?: string } | null;
      
      const mapped: DocumentListItem = {
        id: String(record.id),
        cod_req: toNullableString(record.cod_req),
        data: toNullableString(record.data),
        codigo_do_socio: toNullableString(sociosObj?.codigo_do_socio),
        nome: toNullableString(sociosObj?.nome),
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
