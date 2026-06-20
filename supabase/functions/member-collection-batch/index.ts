// @ts-expect-error: Deno-specific URL imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error: Deno-specific URL imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCollectionProvider } from "../_shared/member-collection/asaas-adapter.ts";

declare const Deno: { env: { get(key: string): string | undefined } };

// Limite operacional V1: Edge Functions não suportam processamento assíncrono
// Para tenants com mais membros, usar p_unit_id para filtrar por polo
const MAX_BATCH_SIZE = 50;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Mapeia billing_type para forma_pagamento (CHECK: dinheiro|pix|transferencia|boleto|cartao)
const FORMA_PAGAMENTO_MAP: Record<string, string> = { BOLETO: "boleto", PIX: "pix" };

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Método não permitido" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Sem cabeçalho de autorização" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !supabaseServiceKey) return jsonResponse({ error: "Configuração interna ausente" }, 500);

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return jsonResponse({ error: "Não autorizado" }, 401);

    const body = await req.json();
    const {
      action, p_tenant_id, competencia_ano, competencia_mes,
      billing_type, due_date, p_unit_id,
    } = body as {
      action: string; p_tenant_id: string;
      competencia_ano: number; competencia_mes: number;
      billing_type: "BOLETO" | "PIX"; due_date: string;
      p_unit_id?: string | null;
    };

    if (action !== "batch-charge") return jsonResponse({ error: `Ação desconhecida: ${action}` }, 400);
    if (!p_tenant_id || !competencia_ano || !competencia_mes || !billing_type || !due_date) {
      return jsonResponse({ error: "Parâmetros obrigatórios ausentes" }, 400);
    }
    if (billing_type !== "BOLETO" && billing_type !== "PIX") {
      return jsonResponse({ error: "billing_type deve ser 'BOLETO' ou 'PIX'" }, 400);
    }

    // ── 1. Validar pertencimento ao tenant ──────────────────────────────────────
    const { data: membership } = await supabaseAdmin
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", user.id)
      .eq("tenant_id", p_tenant_id)
      .eq("is_active", true)
      .maybeSingle();
    if (!membership) return jsonResponse({ error: "Acesso negado para este tenant" }, 403);

    // ── 2. Configuração de recebimento ─────────────────────────────────────────
    const { data: config } = await supabaseAdmin
      .from("configuracao_recebimento")
      .select("provider, api_key, ambiente")
      .eq("tenant_id", p_tenant_id)
      .maybeSingle();
    const typedConfig = config as { provider: string; api_key: string | null; ambiente: string } | null;
    if (!typedConfig || typedConfig.provider === "manual") {
      return jsonResponse({ error: "Nenhum provider de recebimento configurado" }, 422);
    }
    if (!typedConfig.api_key) {
      return jsonResponse({ error: "Credenciais do provider não configuradas" }, 422);
    }

    // ── 3. Parâmetros financeiros — MESMO CONTRATO que financeSettingsService ───
    // Extensão operacional de Configurações Financeiras (FinanceSettingsDialog)
    // NOTA: p_unit_id=null em shared herda a ambiguidade da UI; V1 recomenda batch por polo
    let paramsQuery = supabaseAdmin
      .from("parametros_financeiros")
      .select("regime_padrao, valor_mensalidade")
      .eq("tenant_id", p_tenant_id)
      .limit(1);
    if (p_unit_id) paramsQuery = paramsQuery.eq("unit_id", p_unit_id);
    const { data: params } = await paramsQuery.maybeSingle();
    const typedParams = params as { regime_padrao: string | null; valor_mensalidade: number | null } | null;
    if (!typedParams) return jsonResponse({ error: "Parâmetros financeiros não configurados" }, 422);
    if (typedParams.valor_mensalidade == null) {
      return jsonResponse({ error: "Valor de mensalidade não configurado em Configurações Financeiras" }, 422);
    }

    // ── 4. Membros elegíveis ────────────────────────────────────────────────────
    let membersQuery = supabaseAdmin
      .from("socios")
      .select(`cpf, nome, email, telefone, data_de_admissao,
               financeiro_config_socio!left(regime, isento, data_inicio_cobranca)`)
      .eq("tenant_id", p_tenant_id)
      .eq("situacao", "ATIVO");
    if (p_unit_id) membersQuery = membersQuery.eq("unit_id", p_unit_id);
    const { data: members, error: membersErr } = await membersQuery;
    if (membersErr) throw membersErr;

    const allMembers = (members ?? []) as Array<{
      cpf: string; nome: string | null; email: string | null; telefone: string | null;
      data_de_admissao: string | null;
      financeiro_config_socio: { regime: string | null; isento: boolean; data_inicio_cobranca: string | null } | null;
    }>;

    if (allMembers.length > MAX_BATCH_SIZE) {
      return jsonResponse({
        error: `Lote muito grande (${allMembers.length} membros). Máximo V1: ${MAX_BATCH_SIZE}. Use p_unit_id para filtrar por polo.`,
      }, 400);
    }

    // ── 5. Deduplicar: membros que já têm lançamento nesta competência ──────────
    const cpfs = allMembers.map((m) => m.cpf);
    const { data: existingLancamentos } = await supabaseAdmin
      .from("financeiro_lancamentos")
      .select("socio_cpf")
      .in("socio_cpf", cpfs)
      .eq("competencia_ano", competencia_ano)
      .eq("competencia_mes", competencia_mes)
      .eq("tipo", "mensalidade");
    const cpfsComLancamento = new Set((existingLancamentos ?? []).map((l: { socio_cpf: string }) => l.socio_cpf));

    // ── 6. Filtrar elegíveis e processar ────────────────────────────────────────
    const succeeded: Array<{ cpf: string; lancamentoId: string; fcxId: string; paymentUrl?: string; pixCode?: string }> = [];
    const failed: Array<{ cpf: string; error: string; lancamentoId?: string; fcxId?: string }> = [];
    const skipped: Array<{ cpf: string; reason: string }> = [];

    const sandbox = typedConfig.ambiente === "sandbox";
    const provider = createCollectionProvider(typedConfig.api_key, sandbox);
    const formaPagemento = FORMA_PAGAMENTO_MAP[billing_type] ?? "boleto";

    for (const member of allMembers) {
      const cfg = member.financeiro_config_socio;
      const regimeEfetivo = cfg?.regime ?? typedParams.regime_padrao;
      const isento = cfg?.isento ?? false;

      // Filtros de elegibilidade
      if (isento) { skipped.push({ cpf: member.cpf, reason: "isento" }); continue; }
      if (regimeEfetivo !== "mensalidade") { skipped.push({ cpf: member.cpf, reason: `regime=${regimeEfetivo ?? "null"}` }); continue; }

      // Carência: comparação de datas completas (não de competência)
      // Ex: inicio=2026-07-20, due_date=2026-07-10 → inicio > due_date → skip
      const dataInicio = cfg?.data_inicio_cobranca ?? member.data_de_admissao;
      if (dataInicio && dataInicio > due_date) {
        skipped.push({ cpf: member.cpf, reason: `carência (início=${dataInicio})` }); continue;
      }

      if (cpfsComLancamento.has(member.cpf)) {
        skipped.push({ cpf: member.cpf, reason: "já tem lançamento nesta competência" }); continue;
      }

      // ── Local first: criar lançamento pendente ─────────────────────────────
      const { data: lancRow, error: lancErr } = await supabaseAdmin
        .from("financeiro_lancamentos")
        .insert({
          socio_cpf: member.cpf,
          tipo: "mensalidade",
          competencia_ano,
          competencia_mes,
          valor: typedParams.valor_mensalidade,
          status: "pendente",
          data_pagamento: null,  // preenchido pelo webhook PAYMENT_RECEIVED
          forma_pagamento: formaPagemento,
        })
        .select("id")
        .single();

      if (lancErr) { failed.push({ cpf: member.cpf, error: lancErr.message }); continue; }
      const lancamentoId = (lancRow as { id: string }).id;

      // ── Criar FCX ─────────────────────────────────────────────────────────
      const { data: fcxRow, error: fcxErr } = await supabaseAdmin
        .from("financeiro_cobrancas_externas")
        .insert({
          lancamento_id: lancamentoId,
          tenant_id: p_tenant_id,
          provider: typedConfig.provider,
          valor: typedParams.valor_mensalidade,
          data_vencimento: due_date,
          status: "pendente",
        })
        .select("id")
        .single();

      if (fcxErr) { failed.push({ cpf: member.cpf, error: fcxErr.message, lancamentoId }); continue; }
      const fcxId = (fcxRow as { id: string }).id;

      // ── Provider: ensureCustomer + createCharge ────────────────────────────
      try {
        const customer = await provider.ensureCustomer({
          tenantId: p_tenant_id,
          cpf: member.cpf,
          nome: member.nome ?? "Sócio",
          email: member.email ?? undefined,
          telefone: member.telefone ?? undefined,
        });

        const charge = await provider.createCharge({
          providerCustomerId: customer.providerId,
          amount: typedParams.valor_mensalidade,
          dueDate: due_date,
          billingType: billing_type,
          description: buildDescription(billing_type, member.nome ?? "Sócio", due_date, competencia_mes, competencia_ano),
          externalReference: fcxId,
        });

        await supabaseAdmin
          .from("financeiro_cobrancas_externas")
          .update({ provider_charge_id: charge.providerChargeId, updated_at: new Date().toISOString() })
          .eq("id", fcxId);

        succeeded.push({ cpf: member.cpf, lancamentoId, fcxId, paymentUrl: charge.paymentUrl, pixCode: charge.pixCode });
      } catch (providerErr) {
        await supabaseAdmin
          .from("financeiro_cobrancas_externas")
          .update({ status: "falha", error_message: (providerErr as Error).message, updated_at: new Date().toISOString() })
          .eq("id", fcxId);
        failed.push({ cpf: member.cpf, error: (providerErr as Error).message, lancamentoId, fcxId });
      }
    }

    return jsonResponse({ total: allMembers.length, succeeded, failed, skipped });
  } catch (err) {
    console.error("[member-collection-batch] Erro inesperado:", err);
    return jsonResponse({ error: "Erro interno" }, 500);
  }
});

function buildDescription(billingType: string, nome: string, _dueDate: string, mes: number, ano: number): string {
  const label = billingType === "PIX" ? "PIX" : "Boleto";
  const mesStr = String(mes).padStart(2, "0");
  return `${label} - Mensalidade ${mesStr}/${ano} - ${nome}`;
}
