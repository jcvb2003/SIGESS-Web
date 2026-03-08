-- Migration: 20260411_evolution_requerimentos_full
-- Description: Reestruturação completa e idempotente (Oeiras <-> Z2/Breves)
-- Author: Antigravity
-- Date: 2026-04-11

-- DROP das views dependentes para permitir alteração de colunas na tabela base
DROP VIEW IF EXISTS public.v_requerimentos_busca CASCADE;
DROP VIEW IF EXISTS public.v_situacao_financeira_socio CASCADE;

-- 1. Renomear data → data_assinatura (só se ainda não foi renomeada)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requerimentos' AND column_name = 'data'
  ) THEN
    ALTER TABLE public.requerimentos RENAME COLUMN data TO data_assinatura;
  END IF;
END $$;

-- 2. Adicionar todas as colunas novas com IF NOT EXISTS
ALTER TABLE public.requerimentos
  ADD COLUMN IF NOT EXISTS ano_referencia integer,
  ADD COLUMN IF NOT EXISTS status_mte text DEFAULT 'assinado',
  ADD COLUMN IF NOT EXISTS data_envio date,
  ADD COLUMN IF NOT EXISTS num_req_mte text,
  ADD COLUMN IF NOT EXISTS beneficio_recebido boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Remover status antigo se existir (Oeiras tinha 'status', Z2 não tem)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requerimentos' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.requerimentos RENAME COLUMN status TO status_mte;
  END IF;
END $$;

-- 4. Popular ano_referencia com 2026 onde nulo
UPDATE public.requerimentos 
  SET ano_referencia = 2026 
  WHERE ano_referencia IS NULL;

-- 5. Tornar ano_referencia NOT NULL após popular
ALTER TABLE public.requerimentos 
  ALTER COLUMN ano_referencia SET NOT NULL;

-- 6. CHECK de status_mte
ALTER TABLE public.requerimentos 
  DROP CONSTRAINT IF EXISTS requerimentos_status_mte_check,
  DROP CONSTRAINT IF EXISTS status_check;

ALTER TABLE public.requerimentos
  ADD CONSTRAINT requerimentos_status_mte_check
  CHECK (status_mte IN ('assinado','analise','recurso_acerto','deferido','indeferido'));

-- 7. Constraint de unicidade
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname IN ('unique_cpf_ano', 'requerimentos_cpf_ano_unique')
  ) THEN
    ALTER TABLE public.requerimentos 
      ADD CONSTRAINT requerimentos_cpf_ano_unique UNIQUE (cpf, ano_referencia);
  END IF;
END $$;

-- 8. View: Situação Financeira (CREATE OR REPLACE é idempotente)
CREATE OR REPLACE VIEW public.v_situacao_financeira_socio
WITH (security_invoker = true) AS
WITH base AS (
  SELECT s.cpf, s.nome, s.situacao AS situacao_associativa,
    COALESCE(cfg.regime, pf.regime_padrao) AS regime,
    COALESCE(cfg.isento, false) AS isento,
    COALESCE(cfg.liberado_pelo_presidente, false) AS liberado_presidente,
    array_agg(fl.competencia_ano ORDER BY fl.competencia_ano)
      FILTER (WHERE fl.tipo = 'anuidade' AND fl.status = 'pago') AS anuidades_pagas,
    max(fl.data_pagamento) AS ultimo_pagamento
  FROM public.socios s
    LEFT JOIN (SELECT regime_padrao FROM public.parametros_financeiros LIMIT 1) pf ON true
    LEFT JOIN public.financeiro_config_socio cfg ON cfg.cpf = s.cpf
    LEFT JOIN public.financeiro_lancamentos fl ON fl.socio_cpf = s.cpf
  GROUP BY s.cpf, s.nome, s.situacao, cfg.regime, pf.regime_padrao, cfg.isento, cfg.liberado_pelo_presidente
)
SELECT *,
  CASE
    WHEN isento OR liberado_presidente THEN 'ISENTO'
    WHEN EXTRACT(YEAR FROM CURRENT_DATE)::int = ANY(anuidades_pagas) THEN 'EM_DIA'
    ELSE 'EM_ATRASO'
  END AS situacao_geral
FROM base;

-- 9. View: Busca Global
CREATE OR REPLACE VIEW public.v_requerimentos_busca
WITH (security_invoker = true) AS
SELECT r.*, s.nome AS socio_nome, s.nit AS socio_nit
FROM public.requerimentos r
LEFT JOIN public.socios s ON r.cpf = s.cpf;
