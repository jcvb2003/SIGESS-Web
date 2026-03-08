-- =============================================================================
-- Migration: 20260408_sync_users_final
-- Objetivo: Corrigir a trigger handle_new_user e sincronizar perfis existentes.
-- =============================================================================

-- 1. Corrigir a Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  INSERT INTO public."User" (id, email, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_app_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    role = COALESCE(EXCLUDED.role, public."User".role);
  
  RETURN NEW;
END;
$$;

-- 2. Recriar a Trigger (por precaução)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Sincronização em Massa (Correção de Legados)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT id, email, raw_app_meta_data, created_at
        FROM auth.users
        WHERE deleted_at IS NULL
    ) LOOP
        INSERT INTO public."User" (id, email, role, ativo, "createdAt")
        VALUES (
            r.id, 
            r.email, 
            COALESCE(r.raw_app_meta_data->>'role', 'user'), 
            true, 
            r.created_at
        )
        ON CONFLICT (id) DO UPDATE 
        SET 
            email = EXCLUDED.email,
            role = COALESCE(EXCLUDED.role, public."User".role);
    END LOOP;
END $$;
