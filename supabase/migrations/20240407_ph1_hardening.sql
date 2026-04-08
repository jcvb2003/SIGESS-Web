-- =============================================================================
-- Migration: 20240407_ph1_hardening
-- Fase 1: Segurança (RLS), Correções Críticas (Negócio) e Hardening (SQL)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. HARDENING: SECURITY DEFINER FUNCTIONS (SET search_path)
-- -----------------------------------------------------------------------------

-- public.update_updated_at_column já possui search_path no schema dump.
-- Aplicando aos demais:

ALTER FUNCTION public.check_member_limit() SET search_path TO 'public', 'pg_temp';
ALTER FUNCTION public.handle_delete_user() SET search_path TO 'public', 'pg_temp';
ALTER FUNCTION public.handle_new_user() SET search_path TO 'public', 'pg_temp';
ALTER FUNCTION public.handle_update_user() SET search_path TO 'public', 'pg_temp';
ALTER FUNCTION public.launch_bulk_contribution(uuid) SET search_path TO 'public', 'pg_temp';
ALTER FUNCTION public.update_member_regime(text, text, text) SET search_path TO 'public', 'pg_temp';
ALTER FUNCTION public.register_payment_session(text, uuid, text, date, jsonb, jsonb) SET search_path TO 'public', 'pg_temp';
ALTER FUNCTION public.confirmar_upload_foto(uuid, text) SET search_path TO 'public', 'pg_temp';
ALTER FUNCTION public.update_dae_group(uuid, integer, jsonb) SET search_path TO 'public', 'pg_temp';

-- -----------------------------------------------------------------------------
-- 2. N-01: UPGRADE RLS POLICY PARA "User" (Admins podem ler todos)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow user to read own User data" ON public."User";
CREATE POLICY "Allow user to read own User data" 
ON public."User" FOR SELECT TO authenticated 
USING (
  auth.uid() = id 
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- -----------------------------------------------------------------------------
-- 3. M-01: INADIMPLÊNCIA RESPEITANDO "LIBERADO PELO PRESIDENTE"
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.socio_inadimplente_ano(p_cpf text, p_ano integer)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_isento              boolean;
  v_liberado_presidente boolean;
  v_regime              text;
  v_ano_base            integer;
  v_tem_pagamento       boolean;
BEGIN
  -- Verifica isenção ou liberação manual
  SELECT 
    COALESCE(isento, false),
    COALESCE(liberado_pelo_presidente, false)
  INTO v_isento, v_liberado_presidente
  FROM public.financeiro_config_socio WHERE cpf = p_cpf;
  
  IF v_isento OR v_liberado_presidente THEN RETURN false; END IF;

  SELECT ano_base_cobranca INTO v_ano_base FROM public.parametros_financeiros LIMIT 1;
  IF p_ano < v_ano_base THEN RETURN false; END IF;

  -- Busca o regime vigente (fallback para o padrão global se não definido no sócio)
  SELECT COALESCE(cfg.regime, pf.regime_padrao)
  INTO v_regime
  FROM (SELECT regime_padrao FROM public.parametros_financeiros LIMIT 1) pf
  LEFT JOIN public.financeiro_config_socio cfg ON cfg.cpf = p_cpf;

  IF v_regime = 'anuidade' THEN
    SELECT EXISTS(
      SELECT 1 FROM public.financeiro_lancamentos
      WHERE socio_cpf = p_cpf AND tipo = 'anuidade'
        AND competencia_ano = p_ano AND status = 'pago'
    ) INTO v_tem_pagamento;
  ELSE
    SELECT NOT EXISTS(
      SELECT 1 FROM generate_series(1, EXTRACT(MONTH FROM CURRENT_DATE)::int) m
      WHERE NOT EXISTS (
        SELECT 1 FROM public.financeiro_lancamentos
        WHERE socio_cpf = p_cpf AND tipo = 'mensalidade'
          AND competencia_ano = p_ano AND competencia_mes = m AND status = 'pago'
      )
    ) INTO v_tem_pagamento;
  END IF;

  RETURN NOT v_tem_pagamento;
END;
$function$;

-- -----------------------------------------------------------------------------
-- 4. C-03: RENUMERAÇÃO E LOCK NA TRG_CHECK_MEMBER_LIMIT
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_member_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_max_socios INTEGER;
    v_current_count INTEGER;
BEGIN
    -- LOCK na linha do dono da cota para serializar inserções concorrentes DESTE tenant
    PERFORM 1 FROM public."User" WHERE id = auth.uid() FOR UPDATE;
    
    -- Se o registro do User ainda não foi propagado (onboarding), usa o default de 5
    SELECT COALESCE(max_socios, 5) INTO v_max_socios 
    FROM public."User" 
    WHERE id = auth.uid();
    
    SELECT count(*) INTO v_current_count FROM public.socios;
    
    IF v_current_count >= v_max_socios THEN
        RAISE EXCEPTION 'limite_cadastros: Limite de % sócios atingido.', v_max_socios;
    END IF;
    RETURN NEW;
END; $function$;

-- -----------------------------------------------------------------------------
-- 5. M-02 & M-01 (VIEWS): RESILIÊNCIA CONTRA TABELA VAZIA E LIBERAÇÃO
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_situacao_financeira_socio WITH (security_invoker = on) AS
 SELECT s.cpf, s.nome, s.situacao AS situacao_associativa,
    COALESCE(cfg.regime, pf.regime_padrao) AS regime,
    COALESCE(cfg.isento, false) AS isento,
    COALESCE(cfg.liberado_pelo_presidente, false) AS liberado_presidente,
    array_agg(fl.competencia_ano ORDER BY fl.competencia_ano) FILTER (WHERE ((fl.tipo = 'anuidade'::text) AND (fl.status = 'pago'::text))) AS anuidades_pagas,
    max(fl.data_pagamento) AS ultimo_pagamento
   FROM (public.socios s 
         LEFT JOIN (SELECT regime_padrao FROM public.parametros_financeiros LIMIT 1) pf ON true
         LEFT JOIN public.financeiro_config_socio cfg ON (cfg.cpf = s.cpf))
   LEFT JOIN public.financeiro_lancamentos fl ON (fl.socio_cpf = s.cpf)
   GROUP BY s.cpf, s.nome, s.situacao, cfg.regime, pf.regime_padrao, cfg.isento, cfg.liberado_pelo_presidente;

CREATE OR REPLACE VIEW public.v_debitos_socio WITH (security_invoker = on) AS
 WITH anos AS (
          SELECT generate_series(
            (SELECT COALESCE(MIN(ano_base_cobranca), 2024) FROM public.parametros_financeiros), 
            (EXTRACT(year FROM CURRENT_DATE))::integer
          ) AS ano
        )
 SELECT s.cpf, s.nome, a.ano,
    (NOT (EXISTS ( SELECT 1 FROM public.financeiro_lancamentos fl WHERE ((fl.socio_cpf = s.cpf) AND (fl.tipo = 'anuidade'::text) AND (fl.competencia_ano = a.ano) AND (fl.status = 'pago'::text))))) AS anuidade_pendente,
    COALESCE(cfg.isento, false) AS isento,
    COALESCE(cfg.liberado_pelo_presidente, false) AS liberado
   FROM public.socios s 
   CROSS JOIN anos a
   LEFT JOIN (SELECT regime_padrao FROM public.parametros_financeiros LIMIT 1) pf ON true
   LEFT JOIN public.financeiro_config_socio cfg ON (cfg.cpf = s.cpf)
  WHERE ((COALESCE(cfg.regime, pf.regime_padrao) = 'anuidade'::text) AND (a.ano >= (SELECT COALESCE(MIN(ano_base_cobranca), 2024) FROM public.parametros_financeiros)));

COMMIT;
