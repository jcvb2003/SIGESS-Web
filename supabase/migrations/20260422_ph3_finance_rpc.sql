-- BE-3: RPC para busca paginada de lançamentos por período
-- Otimiza a busca de grandes conjuntos de dados financeiros com join de sócios

CREATE OR REPLACE FUNCTION public.get_payments_by_period_paginated(
    p_start_date date,
    p_end_date date,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0,
    p_order_by text DEFAULT 'data_pagamento',
    p_order_dir text DEFAULT 'DESC'
) RETURNS TABLE (
    id uuid,
    data_pagamento date,
    tipo text,
    competencia_ano integer,
    competencia_mes integer,
    forma_pagamento text,
    valor numeric,
    created_at timestamptz,
    socio_nome text,
    socio_cpf text,
    total_count bigint,
    total_amount numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH base AS (
        SELECT 
            fl.id,
            fl.data_pagamento,
            fl.tipo,
            fl.competencia_ano,
            fl.competencia_mes,
            fl.forma_pagamento,
            fl.valor,
            fl.created_at,
            s.nome as socio_nome,
            s.cpf as socio_cpf
        FROM public.financeiro_lancamentos fl
        JOIN public.socios s ON s.cpf = fl.socio_cpf
        WHERE fl.status = 'pago'
          AND fl.data_pagamento >= p_start_date
          AND fl.data_pagamento <= p_end_date
    ),
    stats AS (
        SELECT count(*) as count, sum(valor) as amount FROM base
    )
    SELECT 
        b.*, 
        st.count as total_count, 
        st.amount as total_amount
    FROM base b, stats st
    ORDER BY 
        CASE WHEN p_order_by = 'data_pagamento' AND p_order_dir = 'ASC' THEN data_pagamento END ASC,
        CASE WHEN p_order_by = 'data_pagamento' AND p_order_dir = 'DESC' THEN data_pagamento END DESC,
        CASE WHEN p_order_by = 'created_at' AND p_order_dir = 'ASC' THEN created_at END ASC,
        CASE WHEN p_order_by = 'created_at' AND p_order_dir = 'DESC' THEN created_at END DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;
