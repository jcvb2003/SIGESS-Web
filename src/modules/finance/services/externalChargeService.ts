import { supabase } from "@/shared/lib/supabase/client";
import type { Tables } from "@/shared/lib/supabase/database.types";

export type ExternalCharge = Tables<"financeiro_cobrancas_externas"> & {
  competencia_ano: number | null;
  competencia_mes: number | null;
};

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
    if (data?.error) throw new Error(data.error);
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
};
