import { supabase } from "@/shared/lib/supabase/client";
import type { Tables } from "@/shared/lib/supabase/database.types";

export type ExternalCharge = Tables<"financeiro_cobrancas_externas">;

export const externalChargeService = {
  // DOIS PASSOS (V1): mais previsível que JOIN REST com FK no Supabase JS
  async getBySocio(cpf: string, tenantId: string): Promise<ExternalCharge[]> {
    // Passo 1: buscar lancamento_ids do sócio
    const { data: lancamentos, error: lancErr } = await supabase
      .from("financeiro_lancamentos")
      .select("id")
      .eq("socio_cpf", cpf);
    if (lancErr) throw lancErr;
    if (!lancamentos || lancamentos.length === 0) return [];

    const ids = lancamentos.map((l: { id: string }) => l.id);

    // Passo 2: buscar FCX pelos lancamento_ids
    const { data, error } = await supabase
      .from("financeiro_cobrancas_externas")
      .select("*")
      .in("lancamento_id", ids)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as ExternalCharge[];
  },

  // Sync via Edge Function (action 'sync-charge')
  async sync(tenantId: string, fcxId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke("member-collection-action", {
      body: { action: "sync-charge", p_tenant_id: tenantId, fcx_id: fcxId },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
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
    if (data?.error) throw new Error(data.error);
  },
};
