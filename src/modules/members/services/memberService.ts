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
import { mapRowToListItem } from "../utils/memberTransformers";

interface MemberBirthMonthRow {
  id: string;
  codigo_do_socio: string | null;
  nome: string | null;
  cpf: string | null;
  updated_at?: string | null;
  total_count: number;
}
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
export interface MemberUnitContext {
  tenantId?: string | null;
  unitId?: string | null;
}

export const memberService = {
  async create(input: MemberRegistrationForm, context: MemberUnitContext): Promise<void> {
    const payload = {
      ...toMemberInsertPayload(input),
      ...(context?.tenantId ? { tenant_id: context.tenantId } : {}),
      ...(context?.unitId ? { unit_id: context.unitId } : {}),
    };
    const { error } = await supabase.from("socios").insert(payload as never);
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
  async searchMembers(params: MemberSearchParams, context?: MemberUnitContext): Promise<MembersResult> {
    const {
      page,
      pageSize,
      searchTerm,
      statusFilter,
      localityCode,
      portariaId,
      birthMonth,
      gender,
      rgpStatus,
    } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from("socios")
      .select(
        "id, codigo_do_socio, nome, cpf, data_de_admissao, situacao, codigo_localidade, portaria_id, data_de_nascimento, updated_at",
        {
          count: "exact",
        },
      );
    if (context?.unitId) {
      query = query.eq("unit_id", context.unitId);
    }
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
    if (portariaId && portariaId !== "all") {
      query = query.eq("portaria_id", portariaId);
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
    const sortField = params.orderBy || "data_de_admissao";
    const ascending = params.orderDirection !== "desc"; // Default to ASC if not 'desc'

    if (birthMonth) {
      const monthInt = parseInt(birthMonth, 10);
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_members_by_birth_month", {
        p_month: monthInt,
        p_limit: pageSize,
        p_offset: from
      });

      if (rpcError) throw rpcError;

      const total = rpcData?.[0]?.total_count ? Number(rpcData[0].total_count) : 0;
      const items = (rpcData as MemberBirthMonthRow[] || []).map((record) => ({
        ...mapRowToListItem(record as unknown as Record<string, unknown>, photoService.getPhotoUrl),
        data_de_admissao: null, // RPC simplificada
        situacao: "Ativo", // Assumido para aniversariantes
        codigo_localidade: null,
      }));

      return { items, total };
    }
    const { data, error, count } = await query
      .order(sortField, { ascending })
      .range(from, to);
    if (error) {
      throw error;
    }
    const items = (data || []).map((item) => mapRowToListItem(item as unknown as Record<string, unknown>, photoService.getPhotoUrl));
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
    const { data, error } = await supabase
      .from("socios")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) {
      throw error;
    }
    if (!data || data.length === 0) {
      throw new Error("O socio nao foi excluido. Verifique se seu perfil tem permissao para essa operacao.");
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
      console.error(`Error fetching member by ID (${id}):`, error);
      return null;
    }
    if (!data) return null;

    const photoUrl = data.cpf ? photoService.getPhotoUrl(data.cpf, data.updated_at || undefined) : null;

    const recordWithPhoto = {
      ...data,
      fotos: photoUrl ? [{ foto_url: photoUrl }] : [],
    };

    return fromMemberRecord(recordWithPhoto);
  },
  async updateMember(
    id: string,
    member: MemberRegistrationForm,
    context: MemberUnitContext,
  ): Promise<void> {
    const payload = toMemberInsertPayload(member);
    let query = supabase.from("socios").update(payload).eq("id", id);
    if (context.unitId) query = query.eq("unit_id", context.unitId);
    const { error } = await query;
    if (error) {
      throw error;
    }
  },
  async touchUpdatedAt(id: string): Promise<void> {
    const { error } = await supabase
      .from("socios")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async countMembers(context?: MemberUnitContext): Promise<{ total: number }> {
    let q = supabase.from("socios").select("*", { count: "exact", head: true });
    if (context?.tenantId) {
      q = q.eq("tenant_id", context.tenantId);
    }
    if (context?.unitId) {
      q = q.eq("unit_id", context.unitId);
    }
    const { count, error } = await q;
    if (error) throw error;
    return { total: count || 0 };
  },
};
