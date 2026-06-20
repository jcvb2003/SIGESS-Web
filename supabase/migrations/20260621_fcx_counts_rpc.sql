CREATE OR REPLACE FUNCTION public.get_external_charges_counts(
  p_tenant_id    uuid,
  p_unit_id      uuid    DEFAULT NULL,
  p_billing_type text    DEFAULT NULL,
  p_mes          integer DEFAULT NULL,
  p_ano          integer DEFAULT NULL,
  p_search       text    DEFAULT NULL
) RETURNS TABLE (status text, count bigint)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT fcx.status, COUNT(*) AS count
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
    AND (p_billing_type IS NULL OR fcx.billing_type = p_billing_type)
    AND (p_mes IS NULL OR l.competencia_mes = p_mes)
    AND (p_ano IS NULL OR l.competencia_ano = p_ano)
    AND (p_search IS NULL OR p_search = '' OR
         l.socio_cpf ILIKE '%' || p_search || '%' OR
         s.nome ILIKE '%' || p_search || '%')
  GROUP BY fcx.status;
$$;

GRANT EXECUTE ON FUNCTION public.get_external_charges_counts TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_external_charges_counts FROM anon;
