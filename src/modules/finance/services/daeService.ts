import { supabase } from "@/shared/lib/supabase/client";
import type { DAEByPeriod, FinanceDAE, FinanceDAEInsert } from "../types/finance.types";

interface DAEByPeriodRow {
  id: string;
  data_pagamento_boleto: string | null;
  data_recebimento: string | null;
  created_at: string | null;
  socio_cpf: string | null;
  tipo_boleto: string | null;
  competencia_ano: number | null;
  competencia_mes: number | null;
  forma_pagamento: string | null;
  boleto_pago: boolean | null;
  valor: number | null;
  status: string | null;
  socios: {
    nome: string | null;
  } | null;
}

interface ImportContextMemberRow {
  cpf: string | null;
  nome: string | null;
}

export const daeService = {
  async getMemberDAE(cpf: string): Promise<FinanceDAE[]> {
    const { data, error } = await supabase
      .from("financeiro_dae")
      .select("*")
      .eq("socio_cpf", cpf)
      .order("competencia_ano", { ascending: false })
      .order("competencia_mes", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getDAEsByPeriod(
    startDate: string,
    endDate: string,
    page: number = 1,
    pageSize: number = 20,
    orderBy: "data_pagamento_boleto" | "created_at" = "data_pagamento_boleto",
  ): Promise<{ data: (DAEByPeriod & { id: string })[]; total: number; totalAmount: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("financeiro_dae")
      .select("id, data_pagamento_boleto, data_recebimento, created_at, socio_cpf, tipo_boleto, competencia_ano, competencia_mes, forma_pagamento, boleto_pago, valor, status, socios(nome)", {
        count: "exact",
      })
      .eq("status", "pago")
      .gte("data_recebimento", startDate)
      .lte("data_recebimento", endDate)
      .order(orderBy, { ascending: false, nullsFirst: false })
      .range(from, to);

    if (error) throw error;

    const rows = (data ?? []) as unknown as DAEByPeriodRow[];
    const totalAmount = rows.reduce((sum, item) => sum + Number(item.valor ?? 0), 0);

    return {
      data: rows.map((item) => ({
        id: item.id,
        data_pagamento_boleto: item.data_pagamento_boleto,
        data_recebimento: item.data_recebimento,
        created_at: item.created_at,
        nome: item.socios?.nome ?? "Sócio não identificado",
        cpf: item.socio_cpf ?? "",
        tipo_boleto: item.tipo_boleto,
        competencia_ano: item.competencia_ano,
        competencia_mes: item.competencia_mes,
        forma_pagamento: item.forma_pagamento,
        boleto_pago: item.boleto_pago,
        valor: Number(item.valor ?? 0),
        status: item.status,
      })),
      total: count ?? 0,
      totalAmount,
    };
  },

  async fetchAllDAEs(
    startDate: string,
    endDate: string,
    orderBy: "data_pagamento_boleto" | "created_at" = "data_pagamento_boleto",
  ): Promise<(DAEByPeriod & { id: string })[]> {
    const { data, error } = await supabase
      .from("financeiro_dae")
      .select("id, data_pagamento_boleto, data_recebimento, created_at, socio_cpf, tipo_boleto, competencia_ano, competencia_mes, forma_pagamento, boleto_pago, valor, status, socios(nome)")
      .eq("status", "pago")
      .gte("data_recebimento", startDate)
      .lte("data_recebimento", endDate)
      .order(orderBy, { ascending: false, nullsFirst: false })
      .limit(10000);

    if (error) throw error;

    return ((data ?? []) as unknown as DAEByPeriodRow[]).map((item) => ({
      id: item.id,
      data_pagamento_boleto: item.data_pagamento_boleto,
      data_recebimento: item.data_recebimento,
      created_at: item.created_at,
      nome: item.socios?.nome ?? "Sócio não identificado",
      cpf: item.socio_cpf ?? "",
      tipo_boleto: item.tipo_boleto,
      competencia_ano: item.competencia_ano,
      competencia_mes: item.competencia_mes,
      forma_pagamento: item.forma_pagamento,
      boleto_pago: item.boleto_pago,
      valor: Number(item.valor ?? 0),
      status: item.status,
    }));
  },

  async getImportContext(): Promise<{
    members: { cpf: string; nome: string | null }[];
    existingKeys: Set<string>;
  }> {
    const [membersResult, daesResult] = await Promise.all([
      supabase.from("socios").select("cpf, nome"),
      supabase
        .from("financeiro_dae")
        .select("socio_cpf, competencia_ano, competencia_mes")
        .neq("status", "cancelado"),
    ]);

    if (membersResult.error) throw membersResult.error;
    if (daesResult.error) throw daesResult.error;

    const members = ((membersResult.data ?? []) as ImportContextMemberRow[])
      .filter((item): item is { cpf: string; nome: string | null } => Boolean(item.cpf))
      .map((item) => ({ cpf: item.cpf, nome: item.nome }));

    const existingKeys = new Set(
      (daesResult.data ?? [])
        .filter((item) => item.socio_cpf && item.competencia_ano && item.competencia_mes)
        .map((item) => `${item.socio_cpf}-${item.competencia_ano}-${item.competencia_mes}`),
    );

    return { members, existingKeys };
  },

  async importDAEs(
    items: {
      cpf: string;
      competenciaAno: number;
      competenciaMes: number;
      valor: number;
      dataRecebimento: string;
      boletoPago?: boolean;
      dataPagamentoBoleto?: string | null;
      tipoBoleto?: "unitario" | "agrupado" | "anual";
    }[],
  ): Promise<void> {
    if (items.length === 0) return;

    const payload: FinanceDAEInsert[] = items.map((item) => ({
      socio_cpf: item.cpf,
      competencia_ano: item.competenciaAno,
      competencia_mes: item.competenciaMes,
      valor: item.valor,
      data_recebimento: item.dataRecebimento,
      forma_pagamento: "boleto",
      tipo_boleto: item.tipoBoleto ?? "unitario",
      boleto_pago: item.boletoPago ?? false,
      data_pagamento_boleto: item.boletoPago ? item.dataPagamentoBoleto ?? item.dataRecebimento : null,
      status: "pago",
    }));

    const { error } = await supabase
      .from("financeiro_dae")
      .insert(payload);

    if (error) throw error;
  },

  async getDAE(id: string): Promise<FinanceDAE> {
    const { data, error } = await supabase
      .from("financeiro_dae")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async createDAE(data: FinanceDAEInsert): Promise<void> {
    const { error } = await supabase
      .from("financeiro_dae")
      .insert(data);

    if (error) throw error;
  },

  async updateBoletoStatus(
    id: string,
    pago: boolean,
    dataPagamento?: string,
  ): Promise<void> {
    const { error } = await supabase
      .from("financeiro_dae")
      .update({
        boleto_pago: pago,
        data_pagamento_boleto: dataPagamento ?? null,
      })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Busca DAEs pagos em uma sessão específica (para comprovante).
   */
  async getSessionDAEs(sessaoId: string): Promise<FinanceDAE[]> {
    const { data, error } = await supabase
      .from("financeiro_dae")
      .select("*")
      .eq("sessao_id", sessaoId)
      .eq("status", "pago");

    if (error) throw error;
    return data ?? [];
  },

  async cancelDAE(id: string, observation: string = "Cancelado pelo operador"): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Busca o registro para verificar se faz parte de um grupo
    const { data: currentItem, error: fetchError } = await supabase
      .from("financeiro_dae")
      .select("grupo_id")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Define a query de atualização (individual ou por grupo)
    let query = supabase.from("financeiro_dae").update({ 
      status: "cancelado",
      cancelado_em: new Date().toISOString(),
      cancelado_por: user?.id ?? null,
      cancelamento_obs: observation
    });

    if (currentItem?.grupo_id) {
      query = query.eq("grupo_id", currentItem.grupo_id);
    } else {
      query = query.eq("id", id);
    }

    const { error: updateError } = await query;
    if (updateError) throw updateError;
  },

  /**
   * Busca todos os membros de um grupo específico.
   */
  async getGroupMembers(grupoId: string): Promise<FinanceDAE[]> {
    const { data, error } = await supabase
      .from("financeiro_dae")
      .select("*")
      .eq("grupo_id", grupoId)
      .order("competencia_mes", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Chama a RPC atômica para atualizar todos os meses de um grupo.
   */
  async updateGroupDAE(
    grupoId: string,
    year: number,
    items: { mes: number; valor: number }[]
  ): Promise<void> {
    const { error } = await supabase.rpc("update_dae_group", {
      p_grupo_id: grupoId,
      p_new_year: year,
      p_items: items,
    });

    if (error) throw error;
  },

  /**
   * ATENÇÃO: Uso restrito. Para edições auditáveis, use o fluxo Cancelar + Criar.
   * @deprecated Use o fluxo de substituição do useUpdateFinanceActions
   */
  async updateDAE(
    id: string, 
    data: Partial<FinanceDAE>
  ): Promise<void> {
    const { error } = await supabase
      .from("financeiro_dae")
      .update(data)
      .eq("id", id);

    if (error) throw error;
  },
};
