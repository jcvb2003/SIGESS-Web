CREATE OR REPLACE FUNCTION public.get_payments_by_period_paginated(
  p_start_date date,
  p_end_date date,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_order_by text DEFAULT 'data_pagamento',
  p_order_dir text DEFAULT 'DESC',
  p_unit_id uuid DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_types text[] DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  data_pagamento date,
  tipo text,
  tipo_exibicao text,
  competencia_ano integer,
  competencia_mes integer,
  forma_pagamento text,
  valor numeric,
  created_at timestamp with time zone,
  socio_nome text,
  socio_cpf text,
  total_count bigint,
  total_amount numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT
      fl.id,
      fl.data_pagamento,
      fl.tipo,
      CASE
        WHEN fl.tipo IN ('contribuicao', 'cadastro_governamental') THEN
          COALESCE(
            NULLIF(BTRIM(fl.descricao), ''),
            NULLIF(BTRIM(tc.nome), ''),
            CASE fl.tipo
              WHEN 'contribuicao' THEN 'Contribuição'
              WHEN 'cadastro_governamental' THEN 'Cadastro governamental'
              ELSE fl.tipo
            END
          )
        ELSE
          CASE fl.tipo
            WHEN 'anuidade' THEN 'Anuidade'
            WHEN 'mensalidade' THEN 'Mensalidade'
            WHEN 'inicial' THEN 'Taxa inicial'
            WHEN 'transferencia' THEN 'Transferência'
            ELSE fl.tipo
          END
      END AS tipo_exibicao,
      fl.competencia_ano,
      fl.competencia_mes,
      fl.forma_pagamento,
      fl.valor,
      fl.created_at,
      s.nome AS socio_nome,
      s.cpf AS socio_cpf
    FROM public.financeiro_lancamentos fl
    JOIN public.socios s ON s.cpf = fl.socio_cpf
    LEFT JOIN public.tipos_cobranca tc ON tc.id = fl.tipo_cobranca_id
    WHERE fl.status = 'pago'
      AND fl.data_pagamento >= p_start_date
      AND fl.data_pagamento <= p_end_date
      AND (p_unit_id IS NULL OR s.unit_id = p_unit_id)
      AND (
        p_types IS NULL
        OR cardinality(p_types) = 0
        OR fl.tipo = ANY (p_types)
      )
      AND (
        p_search IS NULL
        OR BTRIM(p_search) = ''
        OR s.nome ILIKE '%' || p_search || '%'
        OR s.cpf ILIKE '%' || p_search || '%'
        OR fl.tipo ILIKE '%' || p_search || '%'
        OR COALESCE(NULLIF(BTRIM(fl.descricao), ''), NULLIF(BTRIM(tc.nome), '')) ILIKE '%' || p_search || '%'
      )
  ),
  stats AS (
    SELECT COUNT(*) AS count, SUM(base.valor) AS amount
    FROM base
  )
  SELECT
    b.id,
    b.data_pagamento,
    b.tipo,
    b.tipo_exibicao,
    b.competencia_ano,
    b.competencia_mes,
    b.forma_pagamento,
    b.valor,
    b.created_at,
    b.socio_nome,
    b.socio_cpf,
    st.count AS total_count,
    st.amount AS total_amount
  FROM base b, stats st
  ORDER BY
    CASE WHEN p_order_by = 'data_pagamento' AND p_order_dir = 'ASC' THEN b.data_pagamento END ASC,
    CASE WHEN p_order_by = 'data_pagamento' AND p_order_dir = 'DESC' THEN b.data_pagamento END DESC,
    CASE WHEN p_order_by = 'created_at' AND p_order_dir = 'ASC' THEN b.created_at END ASC,
    CASE WHEN p_order_by = 'created_at' AND p_order_dir = 'DESC' THEN b.created_at END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;
