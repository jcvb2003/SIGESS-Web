-- Phase 3: Camada de integração com provider externo de recebimento
-- Modelo 3 camadas:
--   Layer 1: financeiro_lancamentos (verdade local — não muda)
--   Layer 2: financeiro_cobrancas_geradas (mecanismo interno existente — não perturbar)
--   Layer 3: financeiro_cobrancas_externas (esta tabela — nova camada de integração)

CREATE TABLE public.financeiro_cobrancas_externas (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  lancamento_id       uuid        NOT NULL
                                  REFERENCES public.financeiro_lancamentos(id)
                                  ON DELETE RESTRICT,
  tenant_id           uuid        NOT NULL,
  -- tenant_id deve ser idêntico a financeiro_lancamentos.tenant_id para o mesmo lancamento_id
  -- invariante de escrita controlado pelo write path (Edge Function); sem trigger no V1

  provider            text        NOT NULL
                                  CHECK (provider IN ('asaas')),
  provider_charge_id  text,
  status              text        NOT NULL DEFAULT 'pendente'
                                  CHECK (status IN ('pendente','paga','cancelada','expirada','falha')),
  provider_status     text,       -- status bruto do provider para auditoria
  valor               numeric,
  data_vencimento     date,
  payment_url         text,       -- link de pagamento para o sócio
  pix_code            text,       -- código PIX quando disponível
  invoice_url         text,       -- URL da fatura/boleto PDF
  provider_payload    jsonb,      -- snapshot da resposta do provider
  error_message       text,       -- preenchido quando status = 'falha'
  webhook_received_at timestamptz,
  last_synced_at      timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Invariante central: no máximo 1 cobrança ativa OU paga por lançamento
-- Libera recrição após cancelamento, expiração ou falha de criação
CREATE UNIQUE INDEX fcx_lancamento_ativo_idx
  ON public.financeiro_cobrancas_externas (lancamento_id)
  WHERE status IN ('pendente', 'paga');

-- Idempotência de webhook: mesmo provider_charge_id não pode aparecer duas vezes
CREATE UNIQUE INDEX fcx_provider_charge_idx
  ON public.financeiro_cobrancas_externas (provider, provider_charge_id)
  WHERE provider_charge_id IS NOT NULL;

-- Lookup de histórico completo por lançamento (sem filtro de status)
CREATE INDEX fcx_lancamento_historico_idx
  ON public.financeiro_cobrancas_externas (lancamento_id);

CREATE INDEX fcx_tenant_idx
  ON public.financeiro_cobrancas_externas (tenant_id);

ALTER TABLE public.financeiro_cobrancas_externas ENABLE ROW LEVEL SECURITY;

-- Leitura: usuários autenticados do tenant
-- Cobrança externa é informação operacional — todos os usuários do tenant podem ver
CREATE POLICY "fcx_select_tenant"
  ON public.financeiro_cobrancas_externas FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.user_id = auth.uid()
        AND tu.is_active = true
        AND tu.tenant_id = financeiro_cobrancas_externas.tenant_id
    )
  );

-- Escrita: service_role apenas
-- Webhooks e Edge Functions usam service_role; Web nunca escreve diretamente
