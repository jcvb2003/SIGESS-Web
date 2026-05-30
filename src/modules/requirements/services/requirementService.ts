import { supabase } from "@/shared/lib/supabase/client";
import { fetchAll } from "@/shared/lib/supabase/utils";
import { normalizeName as sharedNormalizeName } from "@/shared/utils/text";
import type {
  Requirement,
  RequirementStatus,
  RequirementWithMember,
  RequirementsRpcClient,
} from "../types/requirement.types";

const requirementsRpc = supabase as unknown as RequirementsRpcClient;

export const requirementService = {
  async list(filters: {
    ano?: number;
    status?: RequirementStatus | 'all';
    beneficio_recebido?: boolean | 'all';
    searchTerm?: string;
    carenciaFilter?: string;
    page: number;
    pageSize: number;
    unitId?: string | null;
  }): Promise<{ items: RequirementWithMember[]; total: number }> {
    const beneficioStatus = filters.beneficio_recebido === 'all'
      ? 'all'
      : (filters.beneficio_recebido ? 'recebido' : 'pendente');

    const { data: rpcData, error: rpcError } = await requirementsRpc.rpc("list_requirements_extended", {
      p_ano: filters.ano || new Date().getFullYear(),
      p_status: filters.status || 'all',
      p_beneficio: beneficioStatus,
      p_search: filters.searchTerm || '',
      p_carencia: filters.carenciaFilter || 'all',
      p_page: filters.page,
      p_page_size: filters.pageSize,
      p_unit_id: filters.unitId ?? null,
    });

    if (rpcError) throw rpcError;

    const rpcArray = rpcData ?? [];
    const total = rpcArray.length > 0 ? Number(rpcArray[0].total_count) : 0;

    // Join manual para evitar problemas de embedding com Views no PostgREST
    const cpfs = rpcArray
      .map((r) => r.cpf)
      .filter((cpf: string | null): cpf is string => !!cpf);

    const { data: financeData } = cpfs.length > 0 
      ? await supabase
          .from("v_situacao_financeira_socio")
          .select("cpf, situacao_geral")
          .in("cpf", cpfs)
      : { data: [] };

    const financeMap = Object.fromEntries(
      (financeData || []).map(f => [f.cpf, f.situacao_geral])
    );

    const getSituacaoFinanceira = (situacaoGeral: string | null): 'em_dia' | 'isento' | 'atraso' => {
      if (situacaoGeral === 'EM_DIA') return 'em_dia';
      if (situacaoGeral === 'ISENTO') return 'isento';
      return 'atraso';
    };

    const items = rpcArray.map((item) => {
      const situacaoGeral = financeMap[item.cpf || ""];
      const situacao_financeira = getSituacaoFinanceira(situacaoGeral);

      return {
        ...item,
        member_nome: item.socio_nome ?? "",
        member_nit: item.socio_nit ?? "",
        member_num_rgp: item.socio_num_rgp ?? "",
        member_emissao_rgp: item.socio_emissao_rgp ?? "",
        situacao_financeira,
      } as RequirementWithMember;
    });

    return {
      items,
      total,
    };
  },

  async getById(id: string): Promise<RequirementWithMember | null> {
    const { data, error } = await supabase
      .from("requerimentos")
      .select(`
        *,
        socios (
          nome,
          nit
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching requirement by ID (${id}):`, error);
      return null;
    }
    if (!data) return null;

    const member = Array.isArray(data.socios) ? data.socios[0] : data.socios;

    return {
      ...data,
      member_nome: member?.nome,
      member_nit: member?.nit,
    } as unknown as RequirementWithMember;
  },

  async updateStatus(id: string, ano_referencia: number, status_mte: RequirementStatus, extras?: Partial<Requirement>): Promise<void> {
    const payload: Partial<Requirement> & { status_mte: RequirementStatus, ano_referencia: number } = { 
      status_mte,
      ano_referencia,
      ...extras 
    };
    
    if (status_mte === 'analise' && !payload.data_envio) {
      payload.data_envio = new Date().toISOString().split('T')[0];
    }
    
    const { error } = await supabase
      .from("requerimentos")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    // Log de alteração de status
    await this.logEvent(id, 'mudanca_status', `Status alterado para ${status_mte}`);
  },

  async getEvents(id: string) {
    const { data, error } = await supabase
      .from("logs_eventos_requerimento")
      .select("*")
      .eq("requerimento_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async findMemberForReconciliation(nit: string, nome: string) {
    const cleanNit = String(nit).replaceAll(/\D/g, "");
    
    // 1. Tentar por NIT (Alta Confiança)
    const { data: byNit } = await supabase
      .from("socios")
      .select(`
        cpf,
        nome,
        nit,
        requerimentos (
          id,
          status_mte,
          beneficio_recebido,
          ano_referencia
        )
      `)
      .eq("nit", cleanNit)
      .maybeSingle();

    if (byNit?.cpf) {
      // Buscar saúde financeira
      const { data: finance } = await supabase
        .from("v_situacao_financeira_socio")
        .select("situacao_geral")
        .eq("cpf", byNit.cpf)
        .maybeSingle();

      return {
        member: byNit,
        finance: finance?.situacao_geral || 'ATRASO',
        matchType: byNit.nome?.toUpperCase() === nome.toUpperCase() ? 'FULL' : 'NIT_ONLY'
      };
    }

    // 2. Fallback por Nome (Média Confiança)
    const { data: byNome } = await supabase
      .from("socios")
      .select(`
        cpf,
        nome,
        nit,
        requerimentos (
          id,
          status_mte,
          beneficio_recebido,
          ano_referencia
        )
      `)
      .ilike("nome", nome)
      .maybeSingle();

    if (byNome?.cpf) {
      const { data: finance } = await supabase
        .from("v_situacao_financeira_socio")
        .select("situacao_geral")
        .eq("cpf", byNome.cpf)
        .maybeSingle();

      return {
        member: byNome,
        finance: finance?.situacao_geral || 'ATRASO',
        matchType: 'NAME_ONLY'
      };
    }

    return null;
  },

  async batchUpdateBeneficio(ids: string[], ano_referencia: number) {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Atualizar requerimentos
    const { error } = await supabase
      .from("requerimentos")
      .update({ 
        beneficio_recebido: true,
        status_mte: 'deferido',
        ano_referencia
      })
      .in("id", ids);

    if (error) throw error;

    // 2. Gerar logs
    const logs = ids.map(id => ({
      requerimento_id: id,
      tipo_evento: 'confirmacao_beneficio',
      descricao: "Importação Portal: Benefício Confirmado via Conciliação Assistida",
      usuario_id: user?.id
    }));

    await supabase.from("logs_eventos_requerimento").insert(logs);
  },

  async confirmBeneficio(id: string, ano_referencia: number, value: boolean = true): Promise<void> {
    const { error } = await supabase
      .from("requerimentos")
      .update({ 
        beneficio_recebido: value,
        ano_referencia
      })
      .eq("id", id);

    if (error) throw error;

    await this.logEvent(id, 'confirmacao_beneficio', `Benefício marcado como ${value ? 'recebido' : 'não recebido'}`);
  },

  async logEvent(requerimentoId: string, tipo: 'mudanca_status' | 'confirmacao_beneficio', descricao: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from("logs_eventos_requerimento").insert({
      requerimento_id: requerimentoId,
      tipo_evento: tipo,
      descricao: descricao,
      usuario_id: user?.id
    });
  },

  async create(requirement: Partial<Requirement> & { ano_referencia: number }): Promise<void> {
    const { error } = await supabase
      .from("requerimentos")
      .insert(requirement);

    if (error) throw error;
  },

  async getReconciliationContext(unitId?: string | null): Promise<{
    entityUf: string;
    members: any[];
    financeMap: Map<string, string>;
  }> {
    // 1. Buscar UF da Entidade
    const entidadeQuery = supabase.from("entidade").select("uf").limit(1);
    if (unitId) entidadeQuery.eq("unit_id", unitId);
    const { data: entity } = await entidadeQuery.maybeSingle();

    // 2. Buscar todos os sócios com helper compartilhado
    const allMembers = await fetchAll<any>(
      supabase.from("socios").select(`
        id,
        cpf,
        nome,
        nit,
        requerimentos (
          id,
          status_mte,
          beneficio_recebido,
          ano_referencia
        )
      `)
      .order("id")
    );

    // 3. Buscar situação financeira com helper compartilhado e ordenação estável
    const allFinance = await fetchAll<{ cpf: string; situacao_geral: string }>(
      supabase
        .from("v_situacao_financeira_socio")
        .select("cpf, situacao_geral")
        .order("cpf")
    );

    return {
      entityUf: entity?.uf || 'PA',
      members: allMembers,
      financeMap: new Map(allFinance.map(f => [
        String(f.cpf || "").replaceAll(/\D/g, ""), 
        f.situacao_geral
      ]))
    };
  },

  normalizeName(name: string): string {
    return sharedNormalizeName(name);
  },
};
