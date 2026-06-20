// @ts-expect-error: Deno-specific URL imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error: Deno-specific URL imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCollectionProvider } from "../_shared/member-collection/asaas-adapter.ts";

declare const Deno: { env: { get(key: string): string | undefined } };

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

function buildDescription(billingType: string, nome: string, dueDate: string): string {
  const [year, month] = dueDate.split("-");
  const label = billingType === "PIX" ? "PIX" : "Boleto";
  return `${label} - Mensalidade ${month}/${year} - ${nome}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Sem cabeçalho de autorização" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse({ error: "Configuração interna ausente" }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return jsonResponse({ error: "Não autorizado" }, 401);

    const body = await req.json();
    const { action, p_tenant_id, lancamento_id, billing_type, due_date } = body as {
      action: string;
      p_tenant_id: string;
      lancamento_id: string;
      billing_type: "BOLETO" | "PIX";
      due_date: string;
    };

    // ── Action: sync-charge ───────────────────────────────────────────────────
    if (action === "sync-charge") {
      const { fcx_id } = body as { fcx_id: string };
      if (!p_tenant_id || !fcx_id) return jsonResponse({ error: "p_tenant_id e fcx_id obrigatórios" }, 400);

      const { data: membershipSync } = await supabaseAdmin
        .from("tenant_users").select("tenant_id").eq("user_id", user.id)
        .eq("tenant_id", p_tenant_id).eq("is_active", true).maybeSingle();
      if (!membershipSync) return jsonResponse({ error: "Acesso negado" }, 403);

      const { data: fcxSync } = await supabaseAdmin
        .from("financeiro_cobrancas_externas")
        .select("provider_charge_id, provider")
        .eq("id", fcx_id).eq("tenant_id", p_tenant_id).maybeSingle();
      if (!fcxSync) return jsonResponse({ error: "Cobrança externa não encontrada" }, 404);

      const typedFcxSync = fcxSync as { provider_charge_id: string | null; provider: string };
      if (!typedFcxSync.provider_charge_id) {
        return jsonResponse({ error: "Cobrança sem ID no provider (criação falhou)" }, 422);
      }

      const { data: configSync } = await supabaseAdmin
        .from("configuracao_recebimento")
        .select("api_key, ambiente").eq("tenant_id", p_tenant_id).maybeSingle();
      const typedCfgSync = configSync as { api_key: string | null; ambiente: string } | null;
      if (!typedCfgSync?.api_key) return jsonResponse({ error: "API key não configurada" }, 422);

      const syncProvider = createCollectionProvider(typedCfgSync.api_key, typedCfgSync.ambiente === "sandbox");
      const charge = await syncProvider.fetchCharge(typedFcxSync.provider_charge_id);

      const domainStatus = charge.status;
      await supabaseAdmin
        .from("financeiro_cobrancas_externas")
        .update({ status: domainStatus, provider_status: typedFcxSync.provider, last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", fcx_id);

      return jsonResponse({ status: domainStatus });
    }

    if (action !== "create-charge") {
      return jsonResponse({ error: `Ação desconhecida: ${action}` }, 400);
    }

    if (!p_tenant_id || !lancamento_id || !billing_type || !due_date) {
      return jsonResponse({ error: "Parâmetros obrigatórios ausentes" }, 400);
    }

    if (billing_type !== "BOLETO" && billing_type !== "PIX") {
      return jsonResponse({ error: "billing_type deve ser 'BOLETO' ou 'PIX'" }, 400);
    }

    // ── Passo 2: validar pertencimento ao tenant (anti-spoofing) ─────────────────
    // p_tenant_id explícito + EXISTS em tenant_users evita LIMIT 1 frágil em shared runtime
    const { data: membership } = await supabaseAdmin
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", user.id)
      .eq("tenant_id", p_tenant_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership) {
      return jsonResponse({ error: "Acesso negado para este tenant" }, 403);
    }

    // ── Passo 3: buscar lançamento (sem filtro de tenant_id — coluna não existe) ──
    const { data: lancamento, error: lancErr } = await supabaseAdmin
      .from("financeiro_lancamentos")
      .select("id, socio_cpf, valor")
      .eq("id", lancamento_id)
      .maybeSingle();

    if (lancErr) throw lancErr;
    if (!lancamento) return jsonResponse({ error: "Lançamento não encontrado" }, 404);

    const typedLancamentoRaw = lancamento as { id: string; socio_cpf: string | null; valor: number | null };

    // Validação explícita: schema permite nulos para lançamentos legados/incompletos
    if (!typedLancamentoRaw.socio_cpf) {
      return jsonResponse({ error: "Lançamento sem socio_cpf — não pode gerar cobrança" }, 422);
    }
    if (typedLancamentoRaw.valor == null || typedLancamentoRaw.valor <= 0) {
      return jsonResponse({ error: "Lançamento sem valor válido — não pode gerar cobrança" }, 422);
    }

    // ── Passo 4: verificar posse via socios.tenant_id ─────────────────────────────
    // socios TEM tenant_id no banco vivo (verificado em OEIRAS)
    // tenant_id nullable: null = gap de dados legado → tratado como não-pertencente
    const { data: socio, error: socioErr } = await supabaseAdmin
      .from("socios")
      .select("id, nome, email, telefone")
      .eq("cpf", (lancamento as { socio_cpf: string }).socio_cpf)
      .eq("tenant_id", p_tenant_id)
      .maybeSingle();

    if (socioErr) throw socioErr;
    if (!socio) {
      return jsonResponse({ error: "Lançamento não pertence a este tenant" }, 404);
    }

    const typedLancamento = { id: typedLancamentoRaw.id, socio_cpf: typedLancamentoRaw.socio_cpf!, valor: typedLancamentoRaw.valor! };
    const typedSocio = socio as { nome: string | null; email: string | null; telefone: string | null };

    // ── Passo 5: buscar configuração de recebimento ───────────────────────────────
    const { data: config, error: configErr } = await supabaseAdmin
      .from("configuracao_recebimento")
      .select("provider, api_key, ambiente")
      .eq("tenant_id", p_tenant_id)
      .maybeSingle();

    if (configErr) throw configErr;

    const typedConfig = config as { provider: string; api_key: string | null; ambiente: string } | null;

    if (!typedConfig || typedConfig.provider === "manual") {
      return jsonResponse({ error: "Nenhum provider de recebimento configurado" }, 422);
    }
    if (!typedConfig.api_key) {
      return jsonResponse({ error: "Credenciais do provider não configuradas" }, 422);
    }

    // ── Passo 6: INSERT em financeiro_cobrancas_externas (antes de chamar provider) ─
    const { data: fcxRow, error: fcxInsertErr } = await supabaseAdmin
      .from("financeiro_cobrancas_externas")
      .insert({
        lancamento_id: typedLancamento.id,
        tenant_id: p_tenant_id,
        provider: typedConfig.provider,
        valor: typedLancamento.valor,
        data_vencimento: due_date,
        status: "pendente",
      })
      .select("id")
      .single();

    if (fcxInsertErr) {
      // 23505 = unique_violation → já existe cobrança ativa para este lançamento
      if ((fcxInsertErr as { code?: string }).code === "23505") {
        return jsonResponse({ error: "Já existe cobrança ativa para este lançamento" }, 409);
      }
      throw fcxInsertErr;
    }

    const fcxId = (fcxRow as { id: string }).id;

    // ── Passo 7-8: chamar provider ────────────────────────────────────────────────
    const sandbox = typedConfig.ambiente === "sandbox";
    const provider = createCollectionProvider(typedConfig.api_key, sandbox);

    let charge;
    try {
      const customer = await provider.ensureCustomer({
        tenantId: p_tenant_id,
        cpf: typedLancamento.socio_cpf,
        nome: typedSocio.nome ?? "Sócio",
        email: typedSocio.email ?? undefined,
        telefone: typedSocio.telefone ?? undefined,
      });

      charge = await provider.createCharge({
        providerCustomerId: customer.providerId,
        amount: typedLancamento.valor,
        dueDate: due_date,
        billingType: billing_type,
        description: buildDescription(billing_type, typedSocio.nome ?? "Sócio", due_date),
        externalReference: fcxId,
      });
    } catch (providerErr) {
      // ── Passo 9b: falha no provider → preserva lançamento local, marca falha ───
      const { error: failUpdateErr } = await supabaseAdmin
        .from("financeiro_cobrancas_externas")
        .update({
          status: "falha",
          error_message: (providerErr as Error).message ?? "Erro desconhecido no provider",
          updated_at: new Date().toISOString(),
        })
        .eq("id", fcxId);

      if (failUpdateErr) {
        // Registro fica em 'pendente' com charge criada no provider — logar para diagnóstico
        console.error("[member-collection-action] Falha ao marcar status=falha:", failUpdateErr);
      }

      return jsonResponse(
        { error: "Falha ao criar cobrança no provider", cobrancaId: fcxId },
        502,
      );
    }

    // ── Passo 9a: sucesso → atualizar registro com dados do provider ──────────────
    // provider_status = null: não inventar valor; será preenchido a partir de webhook real
    // pix_qr_code_url não existe na tabela (verificado no banco live OEIRAS)
    const { error: successUpdateErr } = await supabaseAdmin
      .from("financeiro_cobrancas_externas")
      .update({
        provider_charge_id: charge.providerChargeId,
        provider_status: null,
        payment_url: charge.paymentUrl ?? null,
        pix_code: charge.pixCode ?? null,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", fcxId);

    if (successUpdateErr) {
      // Cobrança criada no provider mas registro local sem provider_charge_id
      // → estado inconsistente; logar para reconciliação manual
      console.error(
        "[member-collection-action] Cobrança criada no provider mas UPDATE falhou:",
        { fcxId, providerChargeId: charge.providerChargeId, error: successUpdateErr },
      );
      return jsonResponse(
        {
          error: "Cobrança criada no provider mas falha ao salvar dados localmente",
          cobrancaId: fcxId,
          providerChargeId: charge.providerChargeId,
        },
        500,
      );
    }

    return jsonResponse({
      cobrancaId: fcxId,
      paymentUrl: charge.paymentUrl ?? null,
      pixCode: charge.pixCode ?? null,
    });
  } catch (err) {
    console.error("[member-collection-action] Erro inesperado:", err);
    return jsonResponse({ error: "Erro interno" }, 500);
  }
});
