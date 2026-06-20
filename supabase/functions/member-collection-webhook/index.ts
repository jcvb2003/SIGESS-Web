// @ts-expect-error: Deno-specific URL imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error: Deno-specific URL imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AsaasApiError } from "../_shared/member-collection/asaas-adapter.ts";
import type { CollectionWebhookEvent } from "../_shared/member-collection/types.ts";

// Inline do parseWebhookEvent para evitar instanciar o adapter completo no webhook
// (não temos api_key no contexto do webhook handler)
import { AsaasCollectionAdapter } from "../_shared/member-collection/asaas-adapter.ts";

declare const Deno: { env: { get(key: string): string | undefined } };

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function extractDate(isoTimestamp: string | undefined): string {
  if (!isoTimestamp) return today();
  return isoTimestamp.split("T")[0];
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[webhook] Configuração interna ausente (SUPABASE_URL/SERVICE_KEY)");
    return new Response("ok", { status: 200 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Passo 1: p_tenant_id da URL ────────────────────────────────────────────
  const url = new URL(req.url);
  const p_tenant_id = url.searchParams.get("p_tenant_id");
  if (!p_tenant_id) {
    console.error("[webhook] p_tenant_id ausente na URL");
    return new Response("ok", { status: 200 });  // Asaas não deve retentar erros de config
  }

  // ── Passo 2: buscar configuração de recebimento ─────────────────────────────
  const { data: config, error: configReadErr } = await supabaseAdmin
    .from("configuracao_recebimento")
    .select("webhook_token, provider, api_key, ambiente")
    .eq("tenant_id", p_tenant_id)
    .maybeSingle();

  if (configReadErr) {
    console.error("[webhook] Falha ao ler configuracao_recebimento:", { p_tenant_id, error: configReadErr });
    return new Response("ok", { status: 200 });
  }

  const typedConfig = config as {
    webhook_token: string | null;
    provider: string;
    api_key: string | null;
    ambiente: string;
  } | null;

  if (!typedConfig) {
    console.error("[webhook] Tenant sem configuração de recebimento (não encontrado):", p_tenant_id);
    return new Response("ok", { status: 200 });
  }
  if (!typedConfig.webhook_token) {
    console.error("[webhook] webhook_token não configurado para tenant:", p_tenant_id);
    return new Response("ok", { status: 200 });
  }

  // ── Passo 3: ler body cru + validar token ANTES do parse ───────────────────
  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  const incomingToken = headers["asaas-access-token"];

  if (!incomingToken || incomingToken !== typedConfig.webhook_token) {
    console.warn("[webhook] Token inválido para tenant:", p_tenant_id);
    return new Response("Unauthorized", { status: 401 });
  }

  // ── Passo 4: parsear payload via adapter (token já validado acima) ──────────
  // api_key pode ser null aqui; usamos um adapter sem chamadas HTTP
  const adapter = new AsaasCollectionAdapter(typedConfig.api_key ?? "", typedConfig.ambiente === "sandbox");
  let event: CollectionWebhookEvent;
  try {
    event = adapter.parseWebhookEvent(rawBody, headers, typedConfig.webhook_token);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes("token")) {
      console.warn("[webhook] Rejeição de token no parser:", msg);
      return new Response("Unauthorized", { status: 401 });
    }
    console.error("[webhook] Payload malformado:", msg);
    return new Response("Bad Request", { status: 400 });
  }

  // ── Passo 5: ignorar eventos desconhecidos ──────────────────────────────────
  if (event.type === "OTHER") {
    console.log("[webhook] Evento OTHER ignorado:", event.rawEventType);
    return new Response("ok", { status: 200 });
  }

  // ── Passo 6: buscar financeiro_cobrancas_externas ───────────────────────────
  const { data: fcx, error: fcxReadErr } = await supabaseAdmin
    .from("financeiro_cobrancas_externas")
    .select("id, lancamento_id, status")
    .eq("id", event.externalReference ?? "")
    .eq("tenant_id", p_tenant_id)
    .maybeSingle();

  if (fcxReadErr) {
    console.error("[webhook] Falha ao ler financeiro_cobrancas_externas:", { ref: event.externalReference, error: fcxReadErr });
    return new Response("ok", { status: 200 });
  }
  if (!fcx) {
    console.warn("[webhook] externalReference não encontrado (registro inexistente):", event.externalReference, "tenant:", p_tenant_id);
    return new Response("ok", { status: 200 });
  }

  const typedFcx = fcx as { id: string; lancamento_id: string; status: string };
  const now = new Date().toISOString();

  // ── Passo 7: processar por tipo de evento ───────────────────────────────────

  if (event.type === "PAYMENT_RECEIVED") {
    if (typedFcx.status === "paga") {
      // Idempotência: já pago → só atualiza timestamps e provider_status
      const { error: idemErr } = await supabaseAdmin
        .from("financeiro_cobrancas_externas")
        .update({ provider_status: event.rawEventType, webhook_received_at: now, last_synced_at: now, updated_at: now })
        .eq("id", typedFcx.id);
      if (idemErr) console.warn("[webhook] PAYMENT_RECEIVED idempotente — falha ao atualizar timestamps:", idemErr);
      else console.log("[webhook] PAYMENT_RECEIVED idempotente (já pago):", typedFcx.id);
      return new Response("ok", { status: 200 });
    }

    // FCX deve ser atualizado PRIMEIRO; lançamento só é atualizado se FCX tiver êxito
    // Isso evita divergência: lançamento pago mas FCX ainda pendente
    const { error: fcxErr } = await supabaseAdmin
      .from("financeiro_cobrancas_externas")
      .update({
        status: "paga",
        provider_status: event.rawEventType,
        webhook_received_at: now,
        last_synced_at: now,
        updated_at: now,
      })
      .eq("id", typedFcx.id);

    if (fcxErr) {
      console.error("[webhook] PAYMENT_RECEIVED — falha ao atualizar FCX (lançamento não tocado):", {
        fcxId: typedFcx.id,
        error: fcxErr,
      });
      return new Response("ok", { status: 200 });
    }

    // Atualizar lançamento local — idempotente; só executa se FCX teve êxito
    const { error: lancErr } = await supabaseAdmin
      .from("financeiro_lancamentos")
      .update({
        status: "pago",
        data_pagamento: extractDate(event.paidAt),  // YYYY-MM-DD
        updated_at: now,
      })
      .eq("id", typedFcx.lancamento_id);

    if (lancErr) {
      // FCX já marcado como pago; inconsistência de lançamento → logar para reconciliação
      console.error("[webhook] FCX pago mas falha ao atualizar lançamento:", {
        fcxId: typedFcx.id,
        lancamentoId: typedFcx.lancamento_id,
        error: lancErr,
      });
    }
    return new Response("ok", { status: 200 });
  }

  if (event.type === "PAYMENT_OVERDUE") {
    const { error: overdueErr } = await supabaseAdmin
      .from("financeiro_cobrancas_externas")
      .update({
        status: "expirada",
        provider_status: event.rawEventType,
        webhook_received_at: now,
        last_synced_at: now,
        updated_at: now,
      })
      .eq("id", typedFcx.id);
    if (overdueErr) console.error("[webhook] PAYMENT_OVERDUE — falha ao atualizar FCX:", overdueErr);
    // Lançamento local NÃO alterado — expiração é estado do provider
    return new Response("ok", { status: 200 });
  }

  if (event.type === "PAYMENT_REFUNDED") {
    const { error: refundErr } = await supabaseAdmin
      .from("financeiro_cobrancas_externas")
      .update({
        status: "cancelada",
        provider_status: event.rawEventType,
        webhook_received_at: now,
        last_synced_at: now,
        updated_at: now,
      })
      .eq("id", typedFcx.id);
    if (refundErr) console.error("[webhook] PAYMENT_REFUNDED — falha ao atualizar FCX:", refundErr);
    // Lançamento local NÃO revertido automaticamente — requer ação operacional
    console.warn("[webhook] PAYMENT_REFUNDED: lançamento", typedFcx.lancamento_id, "requer revisão manual");
    return new Response("ok", { status: 200 });
  }

  // Fallback: tipo não tratado (não deve chegar aqui após switch type)
  console.warn("[webhook] Tipo de evento não tratado:", event.type);
  return new Response("ok", { status: 200 });
});
