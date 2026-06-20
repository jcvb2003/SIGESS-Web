-- RPC de listagem global de cobranças externas para página operacional
-- SECURITY DEFINER com checagem explícita de pertencimento via tenant_users
-- p_unit_id: respeita escopo de polo quando informado (NULL = tenant todo)
CREATE OR REPLACE FUNCTION public.get_external_charges_list(
  p_tenant_id     uuid,
  p_unit_id       uuid    DEFAULT NULL,
  p_status        text    DEFAULT NULL,
  p_billing_type  text    DEFAULT NULL,
  p_mes           integer DEFAULT NULL,
  p_ano           integer DEFAULT NULL,
  p_search        text    DEFAULT NULL,
  p_limit         integer DEFAULT 50,
  p_offset        integer DEFAULT 0
) RETURNS TABLE (
  id                  uuid,
  lancamento_id       uuid,
  provider            text,
  status              text,
  billing_type        text,
  valor               numeric,
  data_vencimento     date,
  payment_url         text,
  error_message       text,
  last_synced_at      timestamptz,
  webhook_received_at timestamptz,
  created_at          timestamptz,
  lancamento_status   text,
  competencia_ano     integer,
  competencia_mes     integer,
  socio_cpf           text,
  socio_nome          text,
  total_count         bigint
)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    fcx.id,
    fcx.lancamento_id,
    fcx.provider,
    fcx.status,
    fcx.billing_type,
    fcx.valor,
    fcx.data_vencimento,
    fcx.payment_url,
    fcx.error_message,
    fcx.last_synced_at,
    fcx.webhook_received_at,
    fcx.created_at,
    l.status            AS lancamento_status,
    l.competencia_ano,
    l.competencia_mes,
    l.socio_cpf,
    s.nome              AS socio_nome,
    COUNT(*) OVER ()    AS total_count
  FROM public.financeiro_cobrancas_externas fcx
  JOIN public.financeiro_lancamentos l ON l.id = fcx.lancamento_id
  LEFT JOIN public.socios s ON s.cpf = l.socio_cpf AND s.tenant_id = p_tenant_id
  WHERE fcx.tenant_id = p_tenant_id
    AND EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.user_id = auth.uid()
        AND tu.tenant_id = p_tenant_id
        AND tu.is_active = true
    )
    AND (p_unit_id IS NULL OR s.unit_id = p_unit_id)
    AND (p_status IS NULL OR fcx.status = p_status)
    AND (p_billing_type IS NULL OR fcx.billing_type = p_billing_type)
    AND (p_mes IS NULL OR l.competencia_mes = p_mes)
    AND (p_ano IS NULL OR l.competencia_ano = p_ano)
    AND (
      p_search IS NULL OR p_search = '' OR
      l.socio_cpf ILIKE '%' || p_search || '%' OR
      s.nome ILIKE '%' || p_search || '%'
    )
  ORDER BY fcx.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.get_external_charges_list TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_external_charges_list FROM anon, public;
