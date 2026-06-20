-- Phase 3: Configuração de provider de recebimento por tenant
-- Vive no runtime do tenant (não no Admin DB)
-- Credenciais (api_key, webhook_token) ficam na tabela base
-- mas NUNCA são expostas ao browser — acesso via RPC SECURITY DEFINER

CREATE TABLE public.configuracao_recebimento (
  id               uuid     DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id        uuid     NOT NULL UNIQUE,
  provider         text     NOT NULL DEFAULT 'manual'
                            CHECK (provider IN ('manual', 'asaas')),
  api_key          text,    -- NUNCA exposta ao browser; lida só via Edge Function
  ambiente         text     NOT NULL DEFAULT 'sandbox'
                            CHECK (ambiente IN ('sandbox', 'producao')),
  webhook_token    text,    -- NUNCA exposta ao browser; validada só server-side
  dia_vencimento   integer  NOT NULL DEFAULT 10
                            CHECK (dia_vencimento BETWEEN 1 AND 28),
  forma_padrao     text     NOT NULL DEFAULT 'boleto'
                            CHECK (forma_padrao IN ('boleto', 'pix', 'link')),
  envio_automatico boolean  NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracao_recebimento ENABLE ROW LEVEL SECURITY;

-- SEM policy SELECT para authenticated na tabela base
-- Acesso de leitura ao browser é via RPC get_configuracao_recebimento_publica() abaixo

-- Escrita: owner apenas (credenciais são responsabilidade do dono do tenant)
-- FOR ALL cobre INSERT/UPDATE/DELETE — decisão consciente no V1
-- Se produto futuramente quiser "desabilitar" sem apagar, esta policy pode ser restrita a UPDATE
CREATE POLICY "cfg_recebimento_write_owner"
  ON public.configuracao_recebimento FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.user_id = auth.uid()
        AND tu.is_active = true
        AND tu.tenant_id = configuracao_recebimento.tenant_id
        AND tu.tenant_role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.user_id = auth.uid()
        AND tu.is_active = true
        AND tu.tenant_id = configuracao_recebimento.tenant_id
        AND tu.tenant_role = 'owner'
    )
  );

-- Acesso seguro para o browser: RPC SECURITY DEFINER que mascara api_key e webhook_token
-- Recebe p_tenant_id explícito e valida pertencimento — retorna no máximo 1 linha
-- (tabela tem UNIQUE(tenant_id); sem escopo explícito retornaria todas as configs
--  de tenants que o usuário participa em runtimes compartilhados)
-- auth.uid() funciona sob SECURITY DEFINER no Supabase (lê JWT do connection context)
-- Web chama: supabase.rpc('get_configuracao_recebimento_publica', { p_tenant_id: tenantId })
CREATE OR REPLACE FUNCTION public.get_configuracao_recebimento_publica(p_tenant_id uuid)
RETURNS TABLE (
  id               uuid,
  tenant_id        uuid,
  provider         text,
  ambiente         text,
  dia_vencimento   integer,
  forma_padrao     text,
  envio_automatico boolean,
  has_api_key      boolean,
  has_webhook_token boolean,
  created_at       timestamptz,
  updated_at       timestamptz
)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cr.id,
    cr.tenant_id,
    cr.provider,
    cr.ambiente,
    cr.dia_vencimento,
    cr.forma_padrao,
    cr.envio_automatico,
    (cr.api_key IS NOT NULL)       AS has_api_key,
    (cr.webhook_token IS NOT NULL) AS has_webhook_token,
    cr.created_at,
    cr.updated_at
  FROM public.configuracao_recebimento cr
  WHERE cr.tenant_id = p_tenant_id
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.user_id = auth.uid()
        AND tu.tenant_id = p_tenant_id
        AND tu.is_active = true
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_configuracao_recebimento_publica(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_configuracao_recebimento_publica(uuid) FROM anon, public;
