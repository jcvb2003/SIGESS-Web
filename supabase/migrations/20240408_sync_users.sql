-- =============================================================================
-- Migration: 20240408_sync_users
-- Objetivo: Sincronizar perfis publicos (public.User) com as contas de Auth.
-- Identifica usuarios que existem no Auth mas nao na tabela publica, ou que 
-- estao com dados incompletos (como nome ausente).
-- =============================================================================

DO $$
DECLARE
    r RECORD;
    v_nome TEXT;
    v_role TEXT;
BEGIN
    RAISE NOTICE 'Iniciando sincronizacao de usuarios...';

    FOR r IN (
        SELECT 
            id, 
            email, 
            raw_user_meta_data,
            raw_app_meta_data,
            created_at,
            deleted_at
        FROM auth.users
        WHERE deleted_at IS NULL -- Apenas usuarios ativos
    ) LOOP
        -- Extrair metadados (priorizando user_metadata para nome)
        v_nome := COALESCE(r.raw_user_meta_data->>'nome', split_part(r.email, '@', 1));
        v_role := COALESCE(r.raw_app_meta_data->>'role', r.raw_user_meta_data->>'role', 'user');

        -- UPSERT na tabela public.User
        INSERT INTO public."User" (id, email, nome, role, ativo, "createdAt")
        VALUES (r.id, r.email, v_nome, v_role, true, r.created_at)
        ON CONFLICT (id) DO UPDATE 
        SET 
            email = EXCLUDED.email,
            nome = COALESCE(public."User".nome, EXCLUDED.nome), -- Preserva nome se ja existir
            role = COALESCE(public."User".role, EXCLUDED.role),
            ativo = true;

        RAISE NOTICE 'Sincronizado: % (%)', r.email, v_role;
    END LOOP;

    RAISE NOTICE 'Sincronizacao concluida com sucesso.';
END $$;
