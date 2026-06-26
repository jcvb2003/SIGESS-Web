import { supabase } from "@/shared/lib/supabase/client";
import type { Json } from "@/shared/lib/supabase/database.types";
import type {
  FinanceDashboardParams,
  MemberFinancialSummary,
  PaymentSessionPayload,
  FinanceLancamento,
  FinanceLancamentoInsert,
  PaymentByPeriod,
  PaymentType,
} from "../types/finance.types";
import { toMemberFinancialSummary } from "./transformers/financeDataTransformer";
import { getRequiredYears } from "../domain/annuityRules";

export interface FinanceDashboardResult {
  items: MemberFinancialSummary[];
  total: number;
}

interface PaymentByPeriodRow {
  id: string;
  data_pagamento: string;
  socio_nome: string;
  socio_cpf: string;
  tipo: string;
  tipo_exibicao: string | null;
  competencia_ano: number;
  competencia_mes: number | null;
  forma_pagamento: string;
  valor: number;
  created_at: string;
  total_count: number;
  total_amount: number;
}

const createDashboardQuery = (withCount = false, unitId?: string | null) => {
  const base = withCount
    ? supabase.from("v_situacao_financeira_socio").select("*", { count: "exact" })
    : supabase.from("v_situacao_financeira_socio").select("*");
  return unitId ? base.eq("unit_id", unitId) : base;
};
type DashboardQuery = ReturnType<typeof createDashboardQuery>;

const createDashboardCountQuery = (unitId?: string | null) => {
  const base = supabase
    .from("v_situacao_financeira_socio")
    .select("cpf", { count: "exact", head: true });
  return unitId ? base.eq("unit_id", unitId) : base;
};

type DashboardCountQuery = ReturnType<typeof createDashboardCountQuery>;


export const financeService = {
  async getDashboard(
    params: FinanceDashboardParams,
    unitId?: string | null,
  ): Promise<FinanceDashboardResult> {
    const {
      page,
      pageSize,
      searchTerm,
      year,
      tab,
    } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const anoBase = params.anoBase ?? 2024;

    const requiredYears = getRequiredYears(anoBase, year);

    if (tab === "inadimplentes" && requiredYears.length === 0) {
      return { items: [], total: 0 };
    }

    let query = createDashboardQuery(true, unitId);

    if (searchTerm) {
      query = query.or(`nome.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`);
    }

    // Aplica filtros de tab e avançados
    query = this.applyDashboardFilters(query, params, requiredYears);

    query = query.order("nome", { ascending: true }).range(from, to);

    let { data, error, count } = await query;

    // Fallback: se unit_id não existe na view (projeto sem Wave 5), refaz sem filtro de unidade.
    if (error && (error as { code?: string }).code === "42703" && unitId) {
      const fallback = this.applyDashboardFilters(
        createDashboardQuery(true, null),
        params,
        requiredYears,
      ).order("nome", { ascending: true }).range(from, to);
      ({ data, error, count } = await fallback);
    }

    if (error) throw error;

    const items = (data ?? []).map((row) =>
      toMemberFinancialSummary(row, year, anoBase),
    );

    return { items, total: count ?? 0 };
  },

  /**
   * Helper para aplicar filtros de tab e avançados à query do dashboard.
   */
  applyDashboardFilters(
    query: DashboardQuery,
    params: FinanceDashboardParams,
    requiredYears: number[]
  ) {
    const { tab, filterAnnuityOk, filterAnnuityOverdue, filterExempt, filterReleased } = params;
    let filteredQuery = query;

    // Filtros de Tab
    if (tab === "isentos") {
      filteredQuery = filteredQuery.eq("isento", true);
    } else if (tab === "liberados") {
      filteredQuery = filteredQuery.eq("liberado_presidente", true);
    } else if (tab === "em-dia") {
      filteredQuery = filteredQuery.eq("situacao_geral", "EM_DIA");
    } else if (tab === "inadimplentes") {
      filteredQuery = filteredQuery.eq("situacao_geral", "EM_ATRASO");
    }

    // Filtros Avançados
    if (filterAnnuityOk) {
      filteredQuery = filteredQuery
        .not("isento", "eq", true)
        .not("liberado_presidente", "eq", true);
      if (requiredYears.length > 0) {
        filteredQuery = filteredQuery.contains("anuidades_pagas", requiredYears);
      }
    }
    if (filterAnnuityOverdue) {
      filteredQuery = filteredQuery
        .not("isento", "eq", true)
        .not("liberado_presidente", "eq", true)
        .or(
          `anuidades_pagas.is.null,anuidades_pagas.not.cs.{${requiredYears.join(",")}}`,
        );
    }
    if (filterExempt) {
      filteredQuery = filteredQuery.eq("isento", true);
    }
    if (filterReleased) {
      filteredQuery = filteredQuery.eq("liberado_presidente", true);
    }

    return filteredQuery;
  },

  applyDashboardCountFilters(
    query: DashboardCountQuery,
    params: FinanceDashboardParams,
    requiredYears: number[],
  ) {
    const { tab, filterAnnuityOk, filterAnnuityOverdue, filterExempt, filterReleased } = params;
    let filteredQuery = query;

    if (params.searchTerm) {
      filteredQuery = filteredQuery.or(`nome.ilike.%${params.searchTerm}%,cpf.ilike.%${params.searchTerm}%`);
    }

    if (tab === "isentos") {
      filteredQuery = filteredQuery.eq("isento", true);
    } else if (tab === "liberados") {
      filteredQuery = filteredQuery.eq("liberado_presidente", true);
    } else if (tab === "em-dia") {
      filteredQuery = filteredQuery.eq("situacao_geral", "EM_DIA");
    } else if (tab === "inadimplentes") {
      filteredQuery = filteredQuery.eq("situacao_geral", "EM_ATRASO");
    }

    if (filterAnnuityOk) {
      filteredQuery = filteredQuery
        .not("isento", "eq", true)
        .not("liberado_presidente", "eq", true);
      if (requiredYears.length > 0) {
        filteredQuery = filteredQuery.contains("anuidades_pagas", requiredYears);
      }
    }
    if (filterAnnuityOverdue) {
      filteredQuery = filteredQuery
        .not("isento", "eq", true)
        .not("liberado_presidente", "eq", true)
        .or(`anuidades_pagas.is.null,anuidades_pagas.not.cs.{${requiredYears.join(",")}}`);
    }
    if (filterExempt) {
      filteredQuery = filteredQuery.eq("isento", true);
    }
    if (filterReleased) {
      filteredQuery = filteredQuery.eq("liberado_presidente", true);
    }

    return filteredQuery;
  },

  /**
   * Retorna contagens por aba para os badges do dashboard.
   * 1 RPC com FILTER substitui os 5 HEAD queries independentes.
   */
  async getTabCounts(
    searchTerm: string,
    _year: number,
    _anoBase: number,
    unitId?: string | null,
  ): Promise<Record<string, number>> {
    const { data, error } = await supabase.rpc("get_finance_tab_counts", {
      p_unit_id: unitId ?? null,
      p_search:  searchTerm || null,
    });
    if (error) throw error;
    const row = (data as Array<Record<string, unknown>>)?.[0] ?? {};
    return {
      todos:         Number(row.todos         ?? 0),
      "em-dia":      Number(row.em_dia        ?? 0),
      inadimplentes: Number(row.inadimplentes ?? 0),
      liberados:     Number(row.liberados      ?? 0),
      isentos:       Number(row.isentos        ?? 0),
    };
  },

  /**
   * Retorna arrecadação do mês e DAE pendente para os SummaryCards.
   * DAE pendente = registros com status=pago mas boleto_pago=false.
   */
  async getMonthlyStats(
    year: number,
    month: number,
    unitId?: string | null,
  ): Promise<{ arrecadado: number; arrecadadoAno: number; qtdPagamentos: number; daePendente: number }> {
    const firstDayMonth = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDayMonth = new Date(year, month, 0).toLocaleDateString("sv");
    const firstDayYear = `${year}-01-01`;
    const lastDayYear = `${year}-12-31`;

    // financeiro_lancamentos e financeiro_dae nao tem unit_id direto;
    // escopo por polo e feito via relacao socio_cpf -> socios.unit_id
    const unitSelect = unitId ? "valor, socios!inner(unit_id)" : "valor";
    let qMes = supabase.from("financeiro_lancamentos").select(unitSelect).eq("status", "pago").gte("data_pagamento", firstDayMonth).lte("data_pagamento", lastDayMonth);
    let qAno = supabase.from("financeiro_lancamentos").select(unitSelect).eq("status", "pago").gte("data_pagamento", firstDayYear).lte("data_pagamento", lastDayYear);
    const daeSelect = unitId ? "id, socios!inner(unit_id)" : "id";
    let qDae = supabase.from("financeiro_dae").select(daeSelect, { count: "exact", head: true }).eq("status", "pago").eq("boleto_pago", false);
    if (unitId) {
      qMes = qMes.eq("socios.unit_id", unitId);
      qAno = qAno.eq("socios.unit_id", unitId);
      qDae = qDae.eq("socios.unit_id", unitId);
    }

    const [lancamentosMes, lancamentosAno, daeResult] = await Promise.all([qMes, qAno, qDae]);

    if (lancamentosMes.error) throw lancamentosMes.error;
    if (lancamentosAno.error) throw lancamentosAno.error;
    if (daeResult.error) throw daeResult.error;

    const lancamentosMesRows = (lancamentosMes.data ?? []) as Array<{ valor?: number | string | null }>;
    const lancamentosAnoRows = (lancamentosAno.data ?? []) as Array<{ valor?: number | string | null }>;

    const arrecadado = lancamentosMesRows.reduce(
      (sum, l) => sum + (Number(l.valor) || 0),
      0,
    );

    const arrecadadoAno = lancamentosAnoRows.reduce(
      (sum, l) => sum + (Number(l.valor) || 0),
      0,
    );

    return {
      arrecadado,
      arrecadadoAno,
      qtdPagamentos: lancamentosMes.data?.length ?? 0,
      daePendente: daeResult.count ?? 0,
    };
  },

  /**
   * Registra sessão de pagamento via RPC atômico.
   */
  async createPaymentSession(payload: PaymentSessionPayload, tenantId?: string | null): Promise<void> {
    const { error } = await supabase.rpc("register_payment_session", {
      p_socio_cpf: payload.socioCpf,
      p_sessao_id: payload.sessaoId,
      p_forma_pagamento: payload.paymentMethod,
      p_data_pagamento: payload.paymentDate,
      p_itens: payload.items as unknown as Json,
      p_daes: (payload.daes ?? []) as unknown as Json,
      p_tenant_id: tenantId ?? null,
    });
    if (error) throw error;
  },

  /**
   * Busca extrato / lançamentos de um sócio.
   */
  async getMemberStatement(cpf: string): Promise<FinanceLancamento[]> {
    const { data, error } = await supabase
      .from("financeiro_lancamentos")
      .select("*")
      .eq("socio_cpf", cpf)
      .order("data_pagamento", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getPayment(id: string): Promise<FinanceLancamento> {
    const { data, error } = await supabase
      .from("financeiro_lancamentos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async createPayment(data: FinanceLancamentoInsert): Promise<void> {
    const { error } = await supabase
      .from("financeiro_lancamentos")
      .insert(data);

    if (error) throw error;
  },

  async createPendingLancamento(item: {
    socio_cpf: string;
    tipo: "mensalidade";
    valor: number;
    competencia_ano: number;
    competencia_mes: number;
    forma_pagamento: "boleto" | "pix";
  }): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("financeiro_lancamentos")
      .insert({
        ...item,
        status: "pendente",
        data_pagamento: null,
        registrado_por: user?.id ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return (data as { id: string }).id;
  },

  /**
   * Busca lançamentos por sessão (para comprovante).
   */
  async getSessionPayments(sessaoId: string): Promise<FinanceLancamento[]> {
    const { data, error } = await supabase
      .from("financeiro_lancamentos")
      .select("*")
      .eq("sessao_id", sessaoId)
      .eq("status", "pago");

    if (error) throw error;
    return data ?? [];
  },

  async getPaymentsByPeriod(
    startDate: string,
    endDate: string,
    page: number = 1,
    pageSize: number = 20,
    orderBy: "data_pagamento" | "created_at" = "data_pagamento",
    unitId?: string | null,
    searchTerm = "",
    selectedTypes?: PaymentType[],
    tenantId?: string | null,
  ): Promise<{ data: (PaymentByPeriod & { id: string })[]; total: number; totalAmount: number }> {
    const from = (page - 1) * pageSize;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("get_payments_by_period_paginated", {
      p_start_date: startDate,
      p_end_date: endDate,
      p_limit: pageSize,
      p_offset: from,
      p_order_by: orderBy,
      p_order_dir: "DESC",
      p_search: searchTerm || null,
      p_types: selectedTypes?.length ? selectedTypes : null,
      p_unit_id: unitId ?? null,
      p_tenant_id: tenantId ?? null,
    });

    if (error) {
      console.error("Erro na RPC get_payments_by_period_paginated:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        params: { startDate, endDate, page, pageSize, orderBy, searchTerm, selectedTypes }
      });
      throw error;
    }

    const total = (data as PaymentByPeriodRow[] | null)?.[0]?.total_count ? Number((data as PaymentByPeriodRow[])[0].total_count) : 0;
    const totalAmount = (data as PaymentByPeriodRow[] | null)?.[0]?.total_amount ? Number((data as PaymentByPeriodRow[])[0].total_amount) : 0;

    const items = (data as PaymentByPeriodRow[] || []).map((item) => ({
      id: item.id,
      data_pagamento: item.data_pagamento,
      nome: item.socio_nome,
      cpf: item.socio_cpf,
      tipo: item.tipo,
      tipo_exibicao: item.tipo_exibicao,
      competencia_ano: item.competencia_ano,
      competencia_mes: item.competencia_mes,
      forma_pagamento: item.forma_pagamento,
      valor: Number(item.valor),
      created_at: item.created_at
    }));

    return {
      data: items as (PaymentByPeriod & { id: string })[],
      total,
      totalAmount
    };
  },

  /**
   * Cancela um lançamento (soft delete atômico via RPC).
   */
  async cancelPayment(id: string, observation: string, tenantId?: string | null): Promise<void> {
    const { error } = await supabase.rpc("cancel_payment_v1", {
      p_id: id,
      p_obs: observation,
      p_tenant_id: tenantId ?? null,
    });

    if (error) throw error;
  },

  /**
   * ATENÇÃO: Uso restrito. Para edições auditáveis, use o fluxo Cancelar + Criar.
   * @deprecated Use o fluxo de substituição do useUpdateFinanceActions
   */
  async updatePayment(id: string, data: Partial<FinanceLancamento>): Promise<void> {
    const { error } = await supabase
      .from("financeiro_lancamentos")
      .update(data)
      .eq("id", id);

    if (error) throw error;
  },

  async fetchAllPayments(
    startDate: string,
    endDate: string,
    orderBy: "data_pagamento" | "created_at" = "data_pagamento",
    unitId?: string | null,
    searchTerm = "",
    selectedTypes?: PaymentType[],
    tenantId?: string | null,
  ): Promise<(PaymentByPeriod & { id: string })[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("get_payments_by_period_paginated", {
      p_start_date: startDate,
      p_end_date: endDate,
      p_limit: 10000,
      p_offset: 0,
      p_order_by: orderBy,
      p_order_dir: "DESC",
      p_search: searchTerm || null,
      p_types: selectedTypes?.length ? selectedTypes : null,
      p_unit_id: unitId ?? null,
      p_tenant_id: tenantId ?? null,
    });
    if (error) throw error;
    return ((data as PaymentByPeriodRow[]) || []).map((item) => ({
      id: item.id,
      data_pagamento: item.data_pagamento,
      nome: item.socio_nome,
      cpf: item.socio_cpf,
      tipo: item.tipo,
      tipo_exibicao: item.tipo_exibicao,
      competencia_ano: item.competencia_ano,
      competencia_mes: item.competencia_mes,
      forma_pagamento: item.forma_pagamento,
      valor: Number(item.valor),
      created_at: item.created_at
    }));
  },};
