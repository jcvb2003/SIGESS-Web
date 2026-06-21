// @ts-expect-error: Deno-specific URL imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error: Deno-specific URL imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCollectionProvider, AsaasApiError } from "../_shared/member-collection/asaas-adapter.ts";

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

function buildDescription(billingType: string, nome: string, mes: number, ano: number): string {
  const label = billingType === "PIX" ? "PIX" : "Boleto";
  return `${label} - Mensalidade ${String(mes).padStart(2, "0")}/${ano} - ${nome}`;
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

      const { data: membershipSync, error: membershipSyncErr } = await supabaseAdmin
        .from("tenant_users").select("tenant_id").eq("user_id", user.id)
        .eq("tenant_id", p_tenant_id).eq("is_active", true).maybeSingle();
      if (membershipSyncErr) throw membershipSyncErr;
      if (!membershipSync) return jsonResponse({ error: "Acesso negado" }, 403);

      // busca provider_charge_id + lancamento_id numa única query (evita round-trip extra)
      const { data: fcxSync, error: fcxSyncErr } = await supabaseAdmin
        .from("financeiro_cobrancas_externas")
        .select("provider_charge_id, provider, lancamento_id")
        .eq("id", fcx_id).eq("tenant_id", p_tenant_id).maybeSingle();
      if (fcxSyncErr) throw fcxSyncErr;
      if (!fcxSync) return jsonResponse({ error: "Cobrança externa não encontrada" }, 404);

      const typedFcxSync = fcxSync as { provider_charge_id: string | null; provider: string; lancamento_id: string };
      if (!typedFcxSync.provider_charge_id) {
        return jsonResponse({ error: "Cobrança sem ID no provider (criação falhou)" }, 422);
      }

      const { data: configSync, error: cfgSyncErr } = await supabaseAdmin
        .from("configuracao_recebimento")
        .select("api_key, ambiente").eq("tenant_id", p_tenant_id).maybeSingle();
      if (cfgSyncErr) throw cfgSyncErr;
      const typedCfgSync = configSync as { api_key: string | null; ambiente: string } | null;
      if (!typedCfgSync?.api_key) return jsonResponse({ error: "API key não configurada" }, 422);

      const syncProvider = createCollectionProvider(typedCfgSync.api_key, typedCfgSync.ambiente === "sandbox");

      let charge;
      try {
        charge = await syncProvider.fetchCharge(typedFcxSync.provider_charge_id);
      } catch (fetchErr) {
        // 404 = cobrança não existe mais no provider (ex: deletada manualmente no Asaas)
        // Tratar como cancelada — lançamento local volta a ficar livre para nova emissão
        if (fetchErr instanceof AsaasApiError && fetchErr.status === 404) {
          const now = new Date().toISOString();
          await supabaseAdmin
            .from("financeiro_cobrancas_externas")
            .update({ status: "cancelada", provider_status: "DELETED", last_synced_at: now, updated_at: now })
            .eq("id", fcx_id);
          console.log("[sync-charge] Cobrança não encontrada no provider (404) — marcada como cancelada:", { fcx_id });
          return jsonResponse({ status: "cancelada", detail: "Cobrança não encontrada no provider" });
        }
        throw fetchErr;
      }

      const now = new Date().toISOString();
      const domainStatus = charge.status;
      console.log("[sync-charge] status do provider:", { providerRawStatus: charge.providerRawStatus, domainStatus });

      const { error: fcxUpdateErr } = await supabaseAdmin
        .from("financeiro_cobrancas_externas")
        .update({
          status: domainStatus,
          provider_status: charge.providerRawStatus ?? null,
          last_synced_at: now,
          updated_at: now,
        })
        .eq("id", fcx_id);

      if (fcxUpdateErr) {
        console.error("[sync-charge] Falha ao atualizar FCX:", fcxUpdateErr);
        return jsonResponse({ error: "Falha ao salvar status da cobrança" }, 500);
      }

      if (domainStatus === "paga") {
        const paidDate = charge.paidAt ? charge.paidAt.split("T")[0] : now.split("T")[0];

        // Buscar competência do lançamento FCX-linked para neutralizar conflitos antes do promote
        const { data: fcxLanc } = await supabaseAdmin
          .from("financeiro_lancamentos")
          .select("socio_cpf, competencia_ano, competencia_mes")
          .eq("id", typedFcxSync.lancamento_id)
          .maybeSingle() as { data: { socio_cpf: string; competencia_ano: number; competencia_mes: number } | null };

        // Regra: FCX paga é fonte de verdade final.
        // Cancelar proativamente qualquer lançamento conflitante (não-FCX) para a mesma competência.
        if (fcxLanc) {
          const { error: cancelConflictErr } = await supabaseAdmin
            .from("financeiro_lancamentos")
            .update({
              status: "cancelado",
              cancelado_por: user.id,
              cancelamento_obs: "Cancelado automaticamente: competência quitada via cobrança externa confirmada no Asaas.",
            })
            .eq("socio_cpf", fcxLanc.socio_cpf)
            .eq("competencia_ano", fcxLanc.competencia_ano)
            .eq("competencia_mes", fcxLanc.competencia_mes)
            .neq("id", typedFcxSync.lancamento_id)
            .in("status", ["pendente", "pago"]);

          if (cancelConflictErr) {
            console.error("[sync-charge] Falha ao cancelar lançamento conflitante — abortando promote:", {
              fcx_id, lancamentoId: typedFcxSync.lancamento_id,
              cancelError: cancelConflictErr,
            });
            return jsonResponse({
              error: "Falha ao neutralizar lançamento conflitante antes de reconciliar",
              detail: cancelConflictErr.message,
              code: cancelConflictErr.code,
              hint: cancelConflictErr.hint ?? null,
            }, 500);
          }
        }

        // Promover o lançamento FCX-linked a pago (conflitos já neutralizados)
        const { error: lancUpdateErr } = await supabaseAdmin
          .from("financeiro_lancamentos")
          .update({ status: "pago", data_pagamento: paidDate })
          .eq("id", typedFcxSync.lancamento_id);

        if (lancUpdateErr) {
          console.error("[sync-charge] FCX atualizado mas falha ao promover lançamento:", {
            fcx_id, lancamentoId: typedFcxSync.lancamento_id,
            updateError: lancUpdateErr,
          });
          return jsonResponse({
            error: "Falha ao reconciliar lançamento",
            detail: lancUpdateErr.message,
            code: lancUpdateErr.code,
            hint: lancUpdateErr.hint ?? null,
          }, 500);
        }
      }

      return jsonResponse({ status: domainStatus });
    }

    // ── Action: cancel-charge ─────────────────────────────────────────────────
    if (action === "cancel-charge") {
      const { fcx_id } = body as { fcx_id: string };
      if (!p_tenant_id || !fcx_id) return jsonResponse({ error: "p_tenant_id e fcx_id obrigatórios" }, 400);

      const { data: membershipCancel } = await supabaseAdmin
        .from("tenant_users").select("tenant_id").eq("user_id", user.id)
        .eq("tenant_id", p_tenant_id).eq("is_active", true).maybeSingle();
      if (!membershipCancel) return jsonResponse({ error: "Acesso negado" }, 403);

      const { data: fcxCancel, error: fcxCancelErr } = await supabaseAdmin
        .from("financeiro_cobrancas_externas")
        .select("id, provider_charge_id, status, lancamento_id")
        .eq("id", fcx_id).eq("tenant_id", p_tenant_id).maybeSingle();
      if (fcxCancelErr) throw fcxCancelErr;
      if (!fcxCancel) return jsonResponse({ error: "Cobrança externa não encontrada" }, 404);

      const typedFcxCancel = fcxCancel as { id: string; provider_charge_id: string | null; status: string; lancamento_id: string };

      if (typedFcxCancel.status !== "pendente") {
        return jsonResponse({ error: "Somente cobranças pendentes podem ser canceladas", status: typedFcxCancel.status }, 409);
      }

      // Guard de integridade: lançamento pago vinculado a FCX pendente é estado anômalo
      const { data: lancCancel } = await supabaseAdmin
        .from("financeiro_lancamentos")
        .select("id, status")
        .eq("id", typedFcxCancel.lancamento_id)
        .maybeSingle() as { data: { id: string; status: string } | null };

      if (lancCancel?.status === "pago") {
        return jsonResponse({ error: "Lançamento já pago — inconsistência detectada", lancamento_id: typedFcxCancel.lancamento_id }, 409);
      }

      // Cancelar no provider
      if (typedFcxCancel.provider_charge_id) {
        const { data: cfgCancel } = await supabaseAdmin
          .from("configuracao_recebimento")
          .select("api_key, ambiente").eq("tenant_id", p_tenant_id).maybeSingle();
        const typedCfgCancel = cfgCancel as { api_key: string | null; ambiente: string } | null;

        if (typedCfgCancel?.api_key) {
          try {
            const cancelProvider = createCollectionProvider(typedCfgCancel.api_key, typedCfgCancel.ambiente === "sandbox");
            await cancelProvider.cancelCharge(typedFcxCancel.provider_charge_id);
          } catch (providerCancelErr) {
            // 404 = charge já inexistente no provider → tratar como cancelada, continuar
            if (!(providerCancelErr instanceof AsaasApiError && providerCancelErr.status === 404)) {
              const e = providerCancelErr as { message?: string; code?: string };
              return jsonResponse({ error: "Falha ao cancelar no provider", detail: e.message, code: e.code }, 500);
            }
            console.log("[cancel-charge] Provider 404 — charge inexistente, prosseguindo cancelamento local:", { fcx_id });
          }
        }
      }

      // DELETE FCX primeiro (FK referencia lancamento — ordem importa)
      const { error: fcxDeleteErr } = await supabaseAdmin
        .from("financeiro_cobrancas_externas")
        .delete()
        .eq("id", fcx_id);
      if (fcxDeleteErr) {
        return jsonResponse({ error: "Falha ao excluir cobrança externa", detail: fcxDeleteErr.message, code: fcxDeleteErr.code }, 500);
      }

      // DELETE lançamento
      const { error: lancDeleteErr } = await supabaseAdmin
        .from("financeiro_lancamentos")
        .delete()
        .eq("id", typedFcxCancel.lancamento_id);
      if (lancDeleteErr) {
        console.error("[cancel-charge] FCX excluída mas falha ao excluir lançamento:", { fcx_id, lancamento_id: typedFcxCancel.lancamento_id, error: lancDeleteErr });
        return jsonResponse({ error: "Cobrança excluída no Asaas e localmente, mas falha ao excluir lançamento", detail: lancDeleteErr.message, code: lancDeleteErr.code }, 500);
      }

      return jsonResponse({ deleted: true });
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
      .select("id, socio_cpf, valor, competencia_ano, competencia_mes")
      .eq("id", lancamento_id)
      .maybeSingle();

    if (lancErr) throw lancErr;
    if (!lancamento) return jsonResponse({ error: "Lançamento não encontrado" }, 404);

    const typedLancamentoRaw = lancamento as {
      id: string; socio_cpf: string | null; valor: number | null;
      competencia_ano: number | null; competencia_mes: number | null;
    };

    // Validação explícita: schema permite nulos para lançamentos legados/incompletos
    if (!typedLancamentoRaw.socio_cpf) {
      return jsonResponse({ error: "Lançamento sem socio_cpf — não pode gerar cobrança" }, 422);
    }
    if (typedLancamentoRaw.valor == null || typedLancamentoRaw.valor <= 0) {
      return jsonResponse({ error: "Lançamento sem valor válido — não pode gerar cobrança" }, 422);
    }
    if (!typedLancamentoRaw.competencia_ano || !typedLancamentoRaw.competencia_mes) {
      return jsonResponse({ error: "Lançamento sem competência — cobrança externa requer mensalidade recorrente" }, 422);
    }

    // ── Passo 4: verificar posse via socios.tenant_id ─────────────────────────────
    // socios TEM tenant_id no banco vivo (verificado em OEIRAS)
    // tenant_id nullable: null = gap de dados legado → tratado como não-pertencente
    const { data: socio, error: socioErr } = await supabaseAdmin
      .from("socios")
      .select("id, nome, email, telefone, endereco, num, bairro, cidade, uf, cep")
      .eq("cpf", (lancamento as { socio_cpf: string }).socio_cpf)
      .eq("tenant_id", p_tenant_id)
      .maybeSingle();

    if (socioErr) throw socioErr;
    if (!socio) {
      return jsonResponse({ error: "Lançamento não pertence a este tenant" }, 404);
    }

    const typedLancamento = {
      id: typedLancamentoRaw.id,
      socio_cpf: typedLancamentoRaw.socio_cpf!,
      valor: typedLancamentoRaw.valor!,
      competencia_ano: typedLancamentoRaw.competencia_ano!,
      competencia_mes: typedLancamentoRaw.competencia_mes!,
    };
    const typedSocio = socio as {
      nome: string | null; email: string | null; telefone: string | null;
      endereco: string | null; num: string | null; bairro: string | null;
      cidade: string | null; uf: string | null; cep: string | null;
    };

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

    // ── Passo 6: FCX — reutilizar se existir em status terminal (reemissão), senão inserir ─
    // Reemissão = UPDATE da FCX existente (falha/expirada) com nova data e novo provider_charge_id.
    // Criação inicial = INSERT. Isso evita acúmulo de registros históricos.
    let fcxId: string;

    const { data: fcxExistente } = await supabaseAdmin
      .from("financeiro_cobrancas_externas")
      .select("id, provider_charge_id")
      .eq("lancamento_id", typedLancamento.id)
      .neq("status", "cancelada")
      .neq("status", "pendente")
      .neq("status", "paga")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle() as { data: { id: string; provider_charge_id: string | null } | null };

    if (fcxExistente) {
      // Reemissão: cancelar no provider (best-effort) e reutilizar o registro
      if (fcxExistente.provider_charge_id) {
        try {
          const cp = createCollectionProvider(typedConfig.api_key, typedConfig.ambiente === "sandbox");
          await cp.cancelCharge(fcxExistente.provider_charge_id);
        } catch (e) {
          console.warn("[create-charge] Falha ao cancelar charge anterior no provider:", e);
        }
      }
      const { error: updateErr } = await supabaseAdmin
        .from("financeiro_cobrancas_externas")
        .update({
          billing_type,
          valor: typedLancamento.valor,
          data_vencimento: due_date,
          status: "pendente",
          provider_charge_id: null,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", fcxExistente.id);
      if (updateErr) throw updateErr;
      fcxId = fcxExistente.id;
    } else {
      // Criação inicial: INSERT
      const { data: fcxRow, error: fcxInsertErr } = await supabaseAdmin
        .from("financeiro_cobrancas_externas")
        .insert({
          lancamento_id: typedLancamento.id,
          tenant_id: p_tenant_id,
          provider: typedConfig.provider,
          billing_type,
          valor: typedLancamento.valor,
          data_vencimento: due_date,
          status: "pendente",
        })
        .select("id")
        .single();

      if (fcxInsertErr) {
        // 23505: FCX pendente/paga bloqueando — cancelar e retentar
        const fcxErr = fcxInsertErr as { code?: string; constraint?: string };
        if (fcxErr.code === "23505" && fcxErr.constraint === "fcx_lancamento_ativo_idx") {
          const { data: bloqueantes } = await supabaseAdmin
            .from("financeiro_cobrancas_externas")
            .select("id, provider_charge_id")
            .eq("lancamento_id", typedLancamento.id)
            .neq("status", "cancelada")
            .neq("status", "expirada")
            .neq("status", "falha");

          for (const b of (bloqueantes ?? []) as { id: string; provider_charge_id: string | null }[]) {
            if (b.provider_charge_id) {
              try {
                const cp = createCollectionProvider(typedConfig.api_key, typedConfig.ambiente === "sandbox");
                await cp.cancelCharge(b.provider_charge_id);
              } catch (e) {
                console.warn("[create-charge] Falha ao cancelar bloqueante no provider:", e);
              }
            }
            await supabaseAdmin
              .from("financeiro_cobrancas_externas")
              .update({ status: "cancelada" })
              .eq("id", b.id);
          }

          const { data: fcxRetry, error: fcxRetryErr } = await supabaseAdmin
            .from("financeiro_cobrancas_externas")
            .insert({
              lancamento_id: typedLancamento.id,
              tenant_id: p_tenant_id,
              provider: typedConfig.provider,
              billing_type,
              valor: typedLancamento.valor,
              data_vencimento: due_date,
              status: "pendente",
            })
            .select("id")
            .single();

          if (fcxRetryErr) throw fcxRetryErr;
          fcxId = (fcxRetry as { id: string }).id;
        } else {
          throw fcxInsertErr;
        }
      } else {
        fcxId = (fcxRow as { id: string }).id;
      }
    }

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
        endereco: typedSocio.endereco ?? undefined,
        num: typedSocio.num ?? undefined,
        bairro: typedSocio.bairro ?? undefined,
        cidade: typedSocio.cidade ?? undefined,
        uf: typedSocio.uf ?? undefined,
        cep: typedSocio.cep ?? undefined,
      });

      charge = await provider.createCharge({
        providerCustomerId: customer.providerId,
        amount: typedLancamento.valor,
        dueDate: due_date,
        billingType: billing_type,
        description: buildDescription(
          billing_type,
          typedSocio.nome ?? "Sócio",
          typedLancamento.competencia_mes,
          typedLancamento.competencia_ano,
        ),
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
        {
          error: "Falha ao criar cobrança no provider",
          providerError: (providerErr as Error).message ?? null,
          cobrancaId: fcxId,
        },
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
    const e = err as { message?: string; code?: string; details?: string };
    const message = e.message ?? String(err);
    return jsonResponse({ error: "Erro interno", detail: message, ...(e.code ? { code: e.code } : {}), ...(e.details ? { details: e.details } : {}) }, 500);
  }
});
