-- PHASE 1: HARDENING REMEDIATION (v2)
-- Correcting mistakes from previous migration

-- 1. FIX BUG-5: Correct table and column for member limit
CREATE OR REPLACE FUNCTION public.check_member_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $$
DECLARE
    v_limit integer;
    v_count integer;
BEGIN
    -- Correct table is configuracao_entidade, column is max_socios
    SELECT max_socios INTO v_limit FROM public.configuracao_entidade LIMIT 1;
    
    -- Fallback safety
    v_limit := COALESCE(v_limit, 100);
    
    -- Count all members except 'Excluído'
    SELECT COUNT(*) INTO v_count FROM public.socios WHERE situacao != 'Excluído';
    
    IF v_count >= v_limit AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.situacao = 'Excluído' AND NEW.situacao != 'Excluído')) THEN
        RAISE EXCEPTION 'Limite de sócios atingido (%)', v_limit;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 2. SEC-5: Correct search_path for remaining functions
ALTER FUNCTION public.cancel_payment_v1(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.confirmar_upload_foto(uuid, text) SET search_path = public, pg_temp;

-- 3. SEC-6: Remove permissive policy from foto_upload_tokens
DROP POLICY IF EXISTS "Full access for authenticated workers" ON public.foto_upload_tokens;
-- Also remove the public UPDATE if it's considered junk/risky
DROP POLICY IF EXISTS "Public insert for valid tokens" ON public.foto_upload_tokens;

-- 4. PERF-1: InitPlan Optimization for remaining tables
DO $$
DECLARE
    t text;
    tables_to_fix text[] := ARRAY[
        'audit_log_financeiro', 'financeiro_historico_regime', 
        'parametros_financeiros', 'reap', 'templates', 'tipos_cobranca'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_fix LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Allow all for authenticated users" ON public.%I 
                        FOR ALL TO authenticated 
                        USING ((SELECT auth.uid()) IS NOT NULL)', t);
    END LOOP;
END $$;

-- 5. PERF-1: Specific fix for User table (SELECT policy)
DROP POLICY IF EXISTS "Allow user to read own User data" ON public."User";
CREATE POLICY "Allow user to read own User data" ON public."User"
    FOR SELECT TO authenticated
    USING (((SELECT auth.uid()) = id) OR (((SELECT auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));

-- 6. PERF-1: Specific fix for audit_log_financeiro (SELECT policy for admins)
DROP POLICY IF EXISTS "Admins podem ver auditoria" ON public.audit_log_financeiro;
CREATE POLICY "Admins podem ver auditoria" ON public.audit_log_financeiro
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public."User" WHERE id = (SELECT auth.uid()) AND role = 'admin'));
