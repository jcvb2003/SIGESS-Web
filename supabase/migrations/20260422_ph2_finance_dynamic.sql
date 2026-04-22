-- BUG-8: Cálculo dinâmico de situação financeira na VIEW e suporte a mensalidades
-- Ref: v_situacao_financeira_socio logic update

-- 1. Função auxiliar para cálculo dinâmico
CREATE OR REPLACE FUNCTION public.get_socio_financial_status(
    p_cpf text,
    p_regime text,
    p_isento boolean,
    p_liberado boolean
) RETURNS text AS $$
DECLARE
    v_current_year int := EXTRACT(year FROM CURRENT_DATE);
    v_current_month int := EXTRACT(month FROM CURRENT_DATE);
BEGIN
    IF p_isento OR p_liberado THEN
        RETURN 'ISENTO';
    END IF;

    IF p_regime = 'anuidade' THEN
        IF EXISTS (
            SELECT 1 FROM public.financeiro_lancamentos 
            WHERE socio_cpf = p_cpf AND tipo = 'anuidade' AND competencia_ano = v_current_year AND status = 'pago'
        ) THEN
            RETURN 'EM_DIA';
        ELSE
            RETURN 'EM_ATRASO';
        END IF;
    ELSIF p_regime = 'mensalidade' THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM generate_series(1, v_current_month) m
            WHERE NOT EXISTS (
                SELECT 1 FROM public.financeiro_lancamentos 
                WHERE socio_cpf = p_cpf AND tipo = 'mensalidade' 
                  AND competencia_ano = v_current_year AND competencia_mes = m AND status = 'pago'
            )
        ) THEN
            RETURN 'EM_DIA';
        ELSE
            RETURN 'EM_ATRASO';
        END IF;
    ELSE
        RETURN 'EM_ATRASO';
    END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. Atualizar VIEW (DROP/CREATE para evitar erro de ordenação de colunas)
DROP VIEW IF EXISTS public.v_situacao_financeira_socio CASCADE;

CREATE VIEW public.v_situacao_financeira_socio AS
 WITH base AS (
         SELECT s.cpf,
            s.nome,
            s.situacao AS situacao_associativa,
            COALESCE(cfg.regime, pf.regime_padrao) AS regime,
            COALESCE(cfg.isento, false) AS isento,
            COALESCE(cfg.liberado_pelo_presidente, false) AS liberado_presidente,
            array_agg(fl.competencia_ano ORDER BY fl.competencia_ano) FILTER (WHERE ((fl.tipo = 'anuidade'::text) AND (fl.status = 'pago'::text))) AS anuidades_pagas,
            max(fl.data_pagamento) AS ultimo_pagamento,
            -- Nova coluna adicionada ao final para maior compatibilidade
            array_agg(fl.competencia_mes ORDER BY fl.competencia_mes) FILTER (WHERE ((fl.tipo = 'mensalidade'::text) AND (fl.status = 'pago'::text) AND (fl.competencia_ano = (EXTRACT(year FROM CURRENT_DATE))::int))) AS meses_pagos_atual
           FROM (((public.socios s
             LEFT JOIN ( SELECT parametros_financeiros.regime_padrao
                   FROM public.parametros_financeiros
                 LIMIT 1) pf ON (true))
             LEFT JOIN public.financeiro_config_socio cfg ON ((cfg.cpf = s.cpf)))
             LEFT JOIN public.financeiro_lancamentos fl ON ((fl.socio_cpf = s.cpf)))
          GROUP BY s.cpf, s.nome, s.situacao, cfg.regime, pf.regime_padrao, cfg.isento, cfg.liberado_pelo_presidente
        )
 SELECT cpf,
    nome,
    situacao_associativa,
    regime,
    isento,
    liberado_presidente,
    anuidades_pagas,
    ultimo_pagamento,
    public.get_socio_financial_status(cpf, regime, isento, liberado_presidente) AS situacao_geral,
    meses_pagos_atual
   FROM base;
