import { supabase } from "@/shared/lib/supabase/client";
import { Requirement, RequirementStatus, RequirementWithMember } from "../types/requirement.types";

export const requirementService = {
  async list(filters: {
    ano?: number;
    status?: RequirementStatus | 'all';
    beneficio_recebido?: boolean | 'all';
    searchTerm?: string;
    page: number;
    pageSize: number;
  }): Promise<{ items: RequirementWithMember[]; total: number }> {
    const from = (filters.page - 1) * filters.pageSize;
    const to = from + filters.pageSize - 1;

    let query = supabase
      .from("v_requerimentos_busca")
      .select("*", { count: "exact" });

    if (filters.ano) {
      query = query.eq("ano_referencia", filters.ano);
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq("status_mte", filters.status);
    }

    if (filters.beneficio_recebido !== undefined && filters.beneficio_recebido !== 'all') {
      query = query.eq("beneficio_recebido", filters.beneficio_recebido);
    }

    if (filters.searchTerm) {
      const term = `%${filters.searchTerm}%`;
      query = query.or(`cpf.ilike.${term},cod_req.ilike.${term},socio_nome.ilike.${term}`);
    }

    const { data: reqsData, error: reqsError, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (reqsError) throw reqsError;

    // Join manual para evitar problemas de embedding com Views no PostgREST
    const cpfs = (reqsData || [])
      .map(r => r.cpf)
      .filter((cpf): cpf is string => !!cpf);

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

    const items = (reqsData || []).map((item) => {
      const situacaoGeral = financeMap[item.cpf || ""];
      const situacao_financeira = getSituacaoFinanceira(situacaoGeral);

      return {
        ...item,
        member_nome: item.socio_nome ?? "",
        member_nit: item.socio_nit ?? "",
        situacao_financeira,
      } as RequirementWithMember;
    });

    return {
      items,
      total: count || 0,
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

    if (error || !data) return null;

    const member = Array.isArray(data.socios) ? data.socios[0] : data.socios;

    return {
      ...data,
      member_nome: member?.nome,
      member_nit: member?.nit,
    } as unknown as RequirementWithMember;
  },

  async updateStatus(id: string, status_mte: RequirementStatus, extras?: Partial<Requirement>): Promise<void> {
    const payload: Partial<Requirement> & { status_mte: RequirementStatus } = { 
      status_mte, 
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

  async batchUpdateBeneficio(ids: string[]) {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Atualizar requerimentos
    const { error } = await supabase
      .from("requerimentos")
      .update({ 
        beneficio_recebido: true,
        status_mte: 'deferido'
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

  async confirmBeneficio(id: string, value: boolean = true): Promise<void> {
    const { error } = await supabase
      .from("requerimentos")
      .update({ beneficio_recebido: value })
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

  async getReconciliationContext() {
    // 1. Buscar UF da Entidade
    const { data: entity } = await supabase
      .from("entidade")
      .select("uf")
      .maybeSingle();

    // 2. Buscar todos os sócios com requerimentos
    const { data: members } = await supabase
      .from("socios")
      .select(`
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
      `);

    // 3. Buscar situação financeira em lote
    const { data: finance } = await supabase
      .from("v_situacao_financeira_socio")
      .select("cpf, situacao_geral");

    return {
      entityUf: entity?.uf || 'PA',
      members: members || [],
      financeMap: new Map((finance || []).map(f => [f.cpf, f.situacao_geral]))
    };
  },

  normalizeName(name: string): string {
    return name
      .normalize("NFD")
      .replaceAll(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
  }
};
