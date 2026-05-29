import { supabase } from "@/shared/lib/supabase/client";
import { fetchAll } from "@/shared/lib/supabase/utils";
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

export interface DAECompetenciaStatus {
  id: string;
  boletoPago: boolean;
  dataPagamentoBoleto: string | null;
  competenciaAno: number;
  competenciaMes: number;
  valor: number;
}

function cleanCpf(value: string) {
  return value.replaceAll(/\D/g, "");
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
    unitId?: string | null,
  ): Promise<{ data: (DAEByPeriod & { id: string })[]; total: number; totalAmount: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const selectFields = unitId
      ? "id, data_pagamento_boleto, data_recebimento, created_at, socio_cpf, tipo_boleto, competencia_ano, competencia_mes, forma_pagamento, boleto_pago, valor, status, socios!inner(nome, unit_id)"
      : "id, data_pagamento_boleto, data_recebimento, created_at, socio_cpf, tipo_boleto, competencia_ano, competencia_mes, forma_pagamento, boleto_pago, valor, status, socios(nome)";

    let query = supabase
      .from("financeiro_dae")
      .select(selectFields, { count: "exact" })
      .eq("status", "pago")
      .gte("data_recebimento", startDate)
      .lte("data_recebimento", endDate)
      .order(orderBy, { ascending: false, nullsFirst: false })
      .range(from, to);

    if (unitId) query = query.eq("socios.unit_id", unitId);

    const { data, error, count } = await query;

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
    activeKeys: Set<string>;
    canceledKeys: Set<string>;
  }> {
    const [membersData, daesData] = await Promise.all([
      fetchAll<ImportContextMemberRow>(
        supabase.from("socios").select("cpf, nome").order("cpf"),
      ),
      fetchAll<{
        socio_cpf: string | null;
        competencia_ano: number | null;
        competencia_mes: number | null;
        status: string | null;
      }>(
        supabase
          .from("financeiro_dae")
          .select("socio_cpf, competencia_ano, competencia_mes, status")
          .order("socio_cpf"),
      ),
    ]);

    const members = (membersData ?? [])
      .filter((item): item is { cpf: string; nome: string | null } => Boolean(item.cpf))
      .map((item) => ({ cpf: item.cpf, nome: item.nome }));

    const rows = (daesData ?? []).filter(
      (item): item is {
        socio_cpf: string;
        competencia_ano: number;
        competencia_mes: number;
        status: string | null;
      } =>
        Boolean(item.socio_cpf) &&
        Boolean(item.competencia_ano) &&
        Boolean(item.competencia_mes),
    );

    const activeKeys = new Set(
      rows
        .filter((item) => item.status !== "cancelado")
        .map((item) => `${cleanCpf(item.socio_cpf)}-${item.competencia_ano}-${item.competencia_mes}`),
    );

    const canceledKeys = new Set(
      rows
        .filter((item) => item.status === "cancelado")
        .map((item) => `${cleanCpf(item.socio_cpf)}-${item.competencia_ano}-${item.competencia_mes}`),
    );

    return { members, activeKeys, canceledKeys };
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

    const cpfs = Array.from(new Set(payload.map((item) => item.socio_cpf).filter(Boolean))) as string[];
    const anos = Array.from(new Set(payload.map((item) => item.competencia_ano).filter((value): value is number => value != null)));
    const meses = Array.from(new Set(payload.map((item) => item.competencia_mes).filter((value): value is number => value != null)));

    const { data: existingRows, error: existingError } = await supabase
      .from("financeiro_dae")
      .select("id, socio_cpf, competencia_ano, competencia_mes, status")
      .in("socio_cpf", cpfs)
      .in("competencia_ano", anos)
      .in("competencia_mes", meses);

    if (existingError) throw existingError;

    const existingByKey = new Map(
      (existingRows ?? [])
        .filter((item) => item.socio_cpf && item.competencia_ano && item.competencia_mes)
        .map((item) => [
          `${cleanCpf(item.socio_cpf!)}-${item.competencia_ano}-${item.competencia_mes}`,
          item,
        ]),
    );

    const toInsert: FinanceDAEInsert[] = [];
    const updates = payload
      .map((item) => {
        const key = `${cleanCpf(item.socio_cpf!)}-${item.competencia_ano}-${item.competencia_mes}`;
        const existing = existingByKey.get(key);

        if (!existing) {
          toInsert.push(item);
          return null;
        }

        if (existing.status === "cancelado" && existing.id) {
          return supabase
            .from("financeiro_dae")
            .update({
              valor: item.valor,
              data_recebimento: item.data_recebimento,
              forma_pagamento: item.forma_pagamento,
              tipo_boleto: item.tipo_boleto,
              boleto_pago: item.boleto_pago,
              data_pagamento_boleto: item.data_pagamento_boleto,
              status: "pago",
              cancelado_em: null,
              cancelado_por: null,
              cancelamento_obs: null,
            })
            .eq("id", existing.id);
        }

        return null;
      })
      .filter(Boolean);

    if (updates.length > 0) {
      const results = await Promise.all(updates);
      const failed = results.find((result) => result?.error);
      if (failed?.error) throw failed.error;
    }

    if (toInsert.length === 0) return;

    const { error } = await supabase
      .from("financeiro_dae")
      .insert(toInsert);

    if (error) throw error;
  },
  async getDAEStatusByCompetencia(
    cpf: string,
    competenciaAno: number,
    competenciaMes: number,
  ): Promise<DAECompetenciaStatus | null> {
    const { data, error } = await supabase
      .from("financeiro_dae")
      .select("id, boleto_pago, data_pagamento_boleto, competencia_ano, competencia_mes, valor")
      .eq("socio_cpf", cpf)
      .eq("competencia_ano", competenciaAno)
      .eq("competencia_mes", competenciaMes)
      .neq("status", "cancelado")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;

    const item = data?.[0];
    if (!item?.id || !item.competencia_ano || !item.competencia_mes) {
      return null;
    }

    return {
      id: item.id,
      boletoPago: Boolean(item.boleto_pago),
      dataPagamentoBoleto: item.data_pagamento_boleto ?? null,
      competenciaAno: item.competencia_ano,
      competenciaMes: item.competencia_mes,
      valor: Number(item.valor ?? 0),
    };
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

  async updateGroupDAEFields(
    grupoId: string,
    data: Partial<FinanceDAE>,
  ): Promise<void> {
    const { error } = await supabase
      .from("financeiro_dae")
      .update(data)
      .eq("grupo_id", grupoId);

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
