import { settingsService } from "@/modules/settings/services/settingsService";
import { photoService } from "./photoService";
import { supabase } from "@/shared/lib/supabase/client";
import {
  LocalityOption,
  MemberRegistrationForm,
  MemberSearchParams,
  MembersResult,
} from "../types/member.types";
import {
  toMemberInsertPayload,
  fromMemberRecord,
} from "./memberDataTransformer";
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
export class DuplicateCpfError extends Error {
  code = "DUPLICATE_CPF";
  constructor(message = "CPF já cadastrado.") {
    super(message);
    this.name = "DuplicateCpfError";
  }
}

export class LimitExceededError extends Error {
  code = "LIMIT_EXCEEDED";
  constructor(message = "Limite de cadastros atingido para este período de teste.") {
    super(message);
    this.name = "LimitExceededError";
  }
}
export const memberService = {
  async create(input: MemberRegistrationForm): Promise<void> {
    const payload = toMemberInsertPayload(input);
    const { error } = await supabase.from("socios").insert(payload);
    if (error) {
      const message = String(error.message || "");
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String(
              (
                error as {
                  code?: string;
                }
              ).code ?? "",
            )
          : "";
      const isDuplicate =
        code === "23505" ||
        /duplicate key value/i.test(message) ||
        (/unique/i.test(message) && /cpf/i.test(message));
      if (isDuplicate) {
        throw new DuplicateCpfError();
      }

      if (message.includes("limite_cadastros")) {
        throw new LimitExceededError();
      }

      throw error;
    }
  },
  async searchMembers(params: MemberSearchParams): Promise<MembersResult> {
    const {
      page,
      pageSize,
      searchTerm,
      statusFilter,
      localityCode,
      birthMonth,
      gender,
      rgpStatus,
    } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from("socios")
      .select(
        "id, codigo_do_socio, nome, cpf, data_de_admissao, situacao, codigo_localidade, data_de_nascimento, fotos(foto_url)",
        {
          count: "exact",
        },
      );
    const term = searchTerm.trim();
    if (term) {
      const like = `%${term}%`;
      query = query.or(
        `nome.ilike.${like},cpf.ilike.${like},codigo_do_socio.ilike.${like}`,
      );
    }
    if (statusFilter && statusFilter !== "all") {
      query = query.eq("situacao", statusFilter);
    }
    if (localityCode && localityCode !== "all") {
      query = query.eq("codigo_localidade", localityCode);
    }
    if (gender && gender !== "all") {
      query = query.eq("sexo", gender);
    }
    if (rgpStatus === "with_rgp") {
      query = query
        .not("num_rgp", "is", null)
        .neq("num_rgp", "")
        .not("emissao_rgp", "is", null);
    } else if (rgpStatus === "without_rgp") {
      query = query.or("num_rgp.is.null,num_rgp.eq.,emissao_rgp.is.null");
    }
    const sortField = params.orderBy || "nome";
    const ascending = params.orderDirection !== "desc"; // Default to ASC if not 'desc'

    if (birthMonth) {
      const { data, error } = await query.order(sortField, { ascending });
      if (error) {
        throw error;
      }
      const month = birthMonth.padStart(2, "0");
      const filteredItems = (data || []).filter((item) => {
        const record = item as unknown as { data_de_nascimento: string | null };
        const dob = record.data_de_nascimento;
        if (!dob || typeof dob !== "string") return false;
        return dob.includes(`-${month}-`);
      });
      const total = filteredItems.length;
      const pagedItems = filteredItems.slice(from, to + 1);
      const items = pagedItems.map((item) => {
        const record = item as unknown as {
          id: string;
          codigo_do_socio: string | null;
          nome: string | null;
          cpf: string | null;
          data_de_admissao: string | null;
          situacao: string | null;
          codigo_localidade: string | null;
          fotos: { foto_url: string }[] | null;
        };
        return {
          id: String(record.id),
          codigo_do_socio: toNullableString(record.codigo_do_socio),
          nome: toNullableString(record.nome),
          cpf: toNullableString(record.cpf),
          data_de_admissao: toNullableString(record.data_de_admissao),
          situacao: toNullableString(record.situacao),
          codigo_localidade: toNullableString(record.codigo_localidade),
          foto_url: record.fotos?.[0]?.foto_url ?? null,
        };
      });
      return {
        items,
        total,
      };
    }
    const { data, error, count } = await query
      .order(sortField, { ascending })
      .range(from, to);
    if (error) {
      throw error;
    }
    const items = (data || []).map((item) => {
      const record = item as unknown as {
        id: string;
        codigo_do_socio: string | null;
        nome: string | null;
        cpf: string | null;
        data_de_admissao: string | null;
        situacao: string | null;
        codigo_localidade: string | null;
        fotos: { foto_url: string }[] | null;
      };
      return {
        id: String(record.id),
        codigo_do_socio: toNullableString(record.codigo_do_socio),
        nome: toNullableString(record.nome),
        cpf: toNullableString(record.cpf),
        data_de_admissao: toNullableString(record.data_de_admissao),
        situacao: toNullableString(record.situacao),
        codigo_localidade: toNullableString(record.codigo_localidade),
        foto_url: record.fotos?.[0]?.foto_url ?? null,
      };
    });
    return {
      items,
      total: count ?? items.length,
    };
  },
  async deleteMember(id: string): Promise<void> {
    const { data: member, error: fetchError } = await supabase
      .from("socios")
      .select("cpf")
      .eq("id", id)
      .single();
    if (fetchError) {
      throw fetchError;
    }
    if (member?.cpf) {
      const photoResult = await photoService.deletePhoto(member.cpf);
      if (photoResult.error) {
        throw photoResult.error;
      }
    }
    const { error } = await supabase.from("socios").delete().eq("id", id);
    if (error) {
      throw error;
    }
  },
  async getLocalities(): Promise<LocalityOption[]> {
    const { data, error } = await settingsService.getLocalities();
    if (error) throw error;
    return (data || []).map((item) => ({
      code: item.code ? String(item.code) : "",
      name: String(item.name ?? ""),
    }));
  },
  async getLastRegistrationNumber(prefix: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("socios")
      .select("codigo_do_socio")
      .ilike("codigo_do_socio", `${prefix}%`)
      .order("codigo_do_socio", { ascending: false })
      .limit(1);
    if (error) {
      console.error("Error fetching last registration number:", error);
      return null;
    }
    if (data && data.length > 0) {
      return data[0].codigo_do_socio ? String(data[0].codigo_do_socio) : null;
    }
    return null;
  },
  async getMemberById(id: string): Promise<MemberRegistrationForm | null> {
    const { data, error } = await supabase
      .from("socios")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.error("Error fetching member:", error);
      return null;
    }
    if (!data) return null;
    let photoUrl = null;
    if (data.cpf && typeof data.cpf === "string") {
      photoUrl = await photoService.getPhotoUrl(data.cpf);
    }
    const recordWithPhoto = {
      ...data,
      fotos: photoUrl ? [{ foto_url: photoUrl }] : [],
    };
    return fromMemberRecord(recordWithPhoto);
  },
  async updateMember(
    id: string,
    member: MemberRegistrationForm,
  ): Promise<void> {
    const payload = toMemberInsertPayload(member);
    const { error } = await supabase
      .from("socios")
      .update(payload)
      .eq("id", id);
    if (error) {
      throw error;
    }
  },
  async countMembers(): Promise<{ count: number }> {
    const { count, error } = await supabase
      .from("socios")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    return { count: count || 0 };
  },
};
