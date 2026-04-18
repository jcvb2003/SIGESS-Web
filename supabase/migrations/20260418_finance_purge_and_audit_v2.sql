-- Migration: Purge & Auditoria Financeira v2
-- Data: 2026-04-18

-- 1. RPC para Exclusão Física Individual (Purge)
CREATE OR REPLACE FUNCTION public.purge_payment_v1(p_id uuid)
RETURNS void AS $$
DECLARE
    v_admin_count int;
    v_old_data jsonb;
BEGIN
    -- Validação de Admin
    SELECT count(*) INTO v_admin_count FROM public."User" u
    WHERE u.id = auth.uid() AND u.role = 'admin';
    
    IF v_admin_count = 0 THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de administrador.';
    END IF;

    -- 1. Verificar se o registro existe e se o status é 'cancelado'
    SELECT to_jsonb(l.*) INTO v_old_data 
    FROM public.financeiro_lancamentos l 
    WHERE id = p_id;

    IF v_old_data IS NULL THEN
        RAISE EXCEPTION 'Lançamento não encontrado.';
    END IF;

    IF (v_old_data->>'status') != 'cancelado' THEN
        RAISE EXCEPTION 'Apenas lançamentos com status "cancelado" podem ser excluídos permanentemente.';
    END IF;

    -- 2. Nular FKs em financeiro_cobrancas_geradas (Safety Net)
    UPDATE public.financeiro_cobrancas_geradas
    SET lancamento_id = NULL
    WHERE lancamento_id = p_id;

    -- 3. Registrar no log de auditoria (Operação PURGE)
    INSERT INTO public.audit_log_financeiro (
        table_name, record_id, operation, old_data, changed_by
    ) VALUES (
        'financeiro_lancamentos', p_id, 'PURGE', v_old_data, auth.uid()
    );

    -- 4. Executar DELETE físico
    DELETE FROM public.financeiro_lancamentos WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. RPC para Limpeza em Massa (Bulk Purge)
CREATE OR REPLACE FUNCTION public.purge_cancelled_bulk_v1(p_older_than_days int)
RETURNS int AS $$
DECLARE
    v_count int;
    v_admin_count int;
BEGIN
    -- Validação de Admin
    SELECT count(*) INTO v_admin_count FROM public."User" u
    WHERE u.id = auth.uid() AND u.role = 'admin';
    
    IF v_admin_count = 0 THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de administrador.';
    END IF;

    -- 1. Auditoria individual de cada registro que será removido (Compliance)
    INSERT INTO public.audit_log_financeiro (
        table_name, record_id, operation, old_data, changed_by
    )
    SELECT 
        'financeiro_lancamentos', id, 'PURGE_BULK', to_jsonb(l.*), auth.uid()
    FROM public.financeiro_lancamentos l
    WHERE status = 'cancelado' 
      AND cancelado_em < (now() - (p_older_than_days || ' days')::interval);

    -- 2. Nular FKs em cobranças para evitar erro de integridade
    UPDATE public.financeiro_cobrancas_geradas
    SET lancamento_id = NULL
    WHERE lancamento_id IN (
        SELECT id FROM public.financeiro_lancamentos 
        WHERE status = 'cancelado' 
          AND cancelado_em < (now() - (p_older_than_days || ' days')::interval)
    );

    -- 3. Executar DELETE físico e capturar contagem
    WITH deleted AS (
        DELETE FROM public.financeiro_lancamentos
        WHERE status = 'cancelado'
        AND cancelado_em < (now() - (p_older_than_days || ' days')::interval)
        RETURNING id
    )
    SELECT count(*) INTO v_count FROM deleted;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. RPC para Consulta de Auditoria Paginada
CREATE OR REPLACE FUNCTION public.get_finance_audit_log_v1(
    p_table_name text DEFAULT NULL,
    p_operation text DEFAULT NULL,
    p_limit int DEFAULT 50,
    p_offset int DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    table_name text,
    record_id uuid,
    operation text,
    old_data jsonb,
    new_data jsonb,
    changed_by uuid,
    user_nome text,
    user_email text,
    created_at timestamptz
) AS $$
DECLARE
    v_admin_count int;
BEGIN
    -- Validação de Admin
    SELECT count(*) INTO v_admin_count FROM public."User" u
    WHERE u.id = auth.uid() AND u.role = 'admin';
    
    IF v_admin_count = 0 THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de administrador.';
    END IF;

    RETURN QUERY
    SELECT 
        a.id,
        a.table_name,
        a.record_id,
        a.operation,
        a.old_data,
        a.new_data,
        a.changed_by,
        u.nome as user_nome,
        u.email as user_email,
        a.created_at
    FROM public.audit_log_financeiro a
    LEFT JOIN public."User" u ON u.id = a.changed_by
    WHERE (p_table_name IS NULL OR a.table_name = p_table_name)
      AND (p_operation IS NULL OR a.operation = p_operation)
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- GRANTs de execução
GRANT EXECUTE ON FUNCTION public.purge_payment_v1(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_cancelled_bulk_v1(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_finance_audit_log_v1(text, text, int, int) TO authenticated;

-- Comentários de segurança
COMMENT ON FUNCTION public.purge_payment_v1 IS 'Exclui fisicamente um lançamento cancelado após auditoria. Apenas Admins.';
COMMENT ON FUNCTION public.purge_cancelled_bulk_v1 IS 'Limpa lançamentos cancelados antigos em lote. Apenas Admins.';
COMMENT ON FUNCTION public.get_finance_audit_log_v1 IS 'Busca logs de auditoria financeira com resolução de nome de usuário. Apenas Admins.';
