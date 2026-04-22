-- BE-5: Extensão pg_trgm e índices GIN para busca difusa
-- BE-2: Índice funcional para mês de nascimento

-- 1. Habilitar pg_trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Índices GIN para busca difusa (trigram)
-- Nota: O operador gin_trgm_ops permite buscas eficientes com ILIKE '%termo%'
CREATE INDEX IF NOT EXISTS idx_socios_nome_trgm ON public.socios USING gin (nome gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_socios_cpf_trgm ON public.socios USING gin (cpf gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_socios_codigo_socio_trgm ON public.socios USING gin (codigo_do_socio gin_trgm_ops);

-- 3. Índice funcional para mês de nascimento (BE-2)
-- Isso otimiza o filtro de "Aniversariantes do Mês"
CREATE INDEX IF NOT EXISTS idx_socios_birth_month ON public.socios (EXTRACT(month FROM data_de_nascimento));

-- 4. RPC para busca paginada de aniversariantes (BE-2+)
-- Atualmente filtrado em JS, o que é ineficiente para muitos sócios.
CREATE OR REPLACE FUNCTION public.get_members_by_birth_month(
    p_month integer,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
) RETURNS TABLE (
    id uuid,
    nome text,
    cpf text,
    data_de_nascimento date,
    codigo_do_socio text,
    total_count bigint
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered AS (
        SELECT s.id, s.nome, s.cpf, s.data_de_nascimento, s.codigo_do_socio
        FROM public.socios s
        WHERE EXTRACT(month FROM s.data_de_nascimento) = p_month
    ),
    total AS (
        SELECT count(*) as count FROM filtered
    )
    SELECT f.*, t.count
    FROM filtered f, total t
    ORDER BY f.nome
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;
