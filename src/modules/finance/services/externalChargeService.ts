import { supabase } from "@/shared/lib/supabase/client";
import type { Tables } from "@/shared/lib/supabase/database.types";

export type ExternalCharge = Tables<"financeiro_cobrancas_externas"> & {
  competencia_ano: number | null;
  competencia_mes: number | null;
};

export interface ExternalChargeListItem {
  id: string;
  lancamento_id: string;
  provider: string;
  status: string;
  billing_type: string | null;
  valor: number | null;
  data_vencimento: string | null;
  payment_url: string | null;
  error_message: string | null;
  last_synced_at: string | null;
  webhook_received_at: string | null;
  created_at: string;
  lancamento_status: string | null;
  competencia_ano: number | null;
  competencia_mes: number | null;
  socio_cpf: string | null;
  socio_nome: string | null;
  total_count: number;
}

export interface ExternalChargesListFilters {
  unitId?: string | null;
  status?: string | null;
  billingType?: string | null;
  mes?: number | null;
  ano?: number | null;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const externalChargeService = {
  // DOIS PASSOS (V1): mais previsível que JOIN REST com FK no Supabase JS
  async getBySocio(cpf: string, tenantId: string): Promise<ExternalCharge[]> {
    // Passo 1: buscar lancamento_ids + competência do sócio
    const { data: lancamentos, error: lancErr } = await supabase
      .from("financeiro_lancamentos")
      .select("id, competencia_ano, competencia_mes")
      .eq("socio_cpf", cpf);
    if (lancErr) throw lancErr;
    if (!lancamentos || lancamentos.length === 0) return [];

    type LancRow = { id: string; competencia_ano: number | null; competencia_mes: number | null };
    const competenciaMap = new Map<string, { ano: number | null; mes: number | null }>();
    for (const l of lancamentos as LancRow[]) {
      competenciaMap.set(l.id, { ano: l.competencia_ano, mes: l.competencia_mes });
    }
    const ids = [...competenciaMap.keys()];

    // Passo 2: buscar FCX pelos lancamento_ids
    const { data, error } = await supabase
      .from("financeiro_cobrancas_externas")
      .select("*")
      .in("lancamento_id", ids)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return ((data ?? []) as Tables<"financeiro_cobrancas_externas">[]).map((fcx) => {
      const comp = competenciaMap.get(fcx.lancamento_id);
      return { ...fcx, competencia_ano: comp?.ano ?? null, competencia_mes: comp?.mes ?? null };
    });
  },

  // Sync via Edge Function (action 'sync-charge')
  async sync(tenantId: string, fcxId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke("member-collection-action", {
      body: { action: "sync-charge", p_tenant_id: tenantId, fcx_id: fcxId },
    });
    if (error) throw error;
    if (data?.error) {
      const detail = data.detail ? ` [${data.code ?? ""}] ${data.detail}` : "";
      throw new Error(`${data.error}${detail}`);
    }
  },

  async cancel(tenantId: string, fcxId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke("member-collection-action", {
      body: { action: "cancel-charge", p_tenant_id: tenantId, fcx_id: fcxId },
    });
    if (error) throw error;
    if (data?.error) {
      const detail = data.detail ? ` [${data.code ?? ""}] ${data.detail}` : "";
      throw new Error(`${data.error}${detail}`);
    }
  },

  // Cria cobrança externa para um lançamento existente (primeira tentativa)
  async createCharge(
    tenantId: string,
    lancamentoId: string,
    billingType: "BOLETO" | "PIX",
    dueDate: string,
  ): Promise<{ cobrancaId: string; paymentUrl: string | null; pixCode: string | null }> {
    const { data, error } = await supabase.functions.invoke("member-collection-action", {
      body: {
        action: "create-charge",
        p_tenant_id: tenantId,
        lancamento_id: lancamentoId,
        billing_type: billingType,
        due_date: dueDate,
      },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.providerError ?? data.error);
    return data as { cobrancaId: string; paymentUrl: string | null; pixCode: string | null };
  },

  // Reemissão: cria NOVO FCX para o mesmo lançamento
  // (FCX anterior em status 'falha'|'expirada' libera o partial unique index)
  async reissue(
    tenantId: string,
    lancamentoId: string,
    billingType: "BOLETO" | "PIX",
    dueDate: string,
  ): Promise<void> {
    const { data, error } = await supabase.functions.invoke("member-collection-action", {
      body: {
        action: "create-charge",
        p_tenant_id: tenantId,
        lancamento_id: lancamentoId,
        billing_type: billingType,
        due_date: dueDate,
      },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.providerError ?? data.error);
  },

  async getList(
    tenantId: string,
    filters: ExternalChargesListFilters,
  ): Promise<{ data: ExternalChargeListItem[]; total: number }> {
    const { page = 1, pageSize = 50, unitId, status, billingType, mes, ano, search } = filters;
    const { data, error } = await supabase.rpc(
      "get_external_charges_list" as never,
      {
        p_tenant_id: tenantId,
        p_unit_id: unitId ?? null,
        p_status: status ?? null,
        p_billing_type: billingType ?? null,
        p_mes: mes ?? null,
        p_ano: ano ?? null,
        p_search: search || null,
        p_limit: pageSize,
        p_offset: (page - 1) * pageSize,
      } as never,
    );
    if (error) throw error;
    const rows = (data as ExternalChargeListItem[]) ?? [];
    return { data: rows, total: rows[0]?.total_count ?? 0 };
  },

  async getCounts(
    tenantId: string,
    filters: Omit<ExternalChargesListFilters, "status" | "page" | "pageSize">,
  ): Promise<Record<string, number>> {
    const { unitId, billingType, mes, ano, search } = filters;
    const { data, error } = await supabase.rpc(
      "get_external_charges_counts" as never,
      {
        p_tenant_id: tenantId,
        p_unit_id: unitId ?? null,
        p_billing_type: billingType ?? null,
        p_mes: mes ?? null,
        p_ano: ano ?? null,
        p_search: search || null,
      } as never,
    );
    if (error) throw error;
    const rows = (data as { status: string; count: number }[]) ?? [];
    return Object.fromEntries(rows.map((r) => [r.status, r.count]));
  },
};
