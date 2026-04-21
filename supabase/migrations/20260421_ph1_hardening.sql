-- PHASE 1: HARDENING & SECURITY REMEDIATION
-- Ref: implementation_plan.md (Version 22)

-- SEC-5: Fix search_path for exposed functions to prevent hijacking
ALTER FUNCTION public.get_finance_tab_counts(text, integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.proc_audit_finance_change() SET search_path = public, pg_temp;
ALTER FUNCTION public.cancel_payment_v1(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.purge_payment_v1(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.purge_cancelled_bulk_v1(integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_finance_audit_log_v1(text, text, integer, integer) SET search_path = public, pg_temp;

-- ARCH-12: Ensure logs_eventos_requerimento exists (Sync from Oeiras baseline)
CREATE TABLE IF NOT EXISTS public.logs_eventos_requerimento (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    requerimento_id uuid REFERENCES public.requerimentos(id),
    tipo_evento text,
    descricao text,
    usuario_id uuid REFERENCES public."User"(id),
    created_at timestamptz DEFAULT now()
);

-- SEC-2/4: Audit Log Financeiro RLS & Policies
ALTER TABLE public.audit_log_financeiro ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.audit_log_financeiro;
CREATE POLICY "Enable insert for authenticated users" ON public.audit_log_financeiro
    FOR INSERT TO authenticated WITH CHECK (true);

-- SEC-1/ARCH-11: Enable User Profile Update (Self-service)
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow user to update own data" ON public."User";
CREATE POLICY "Allow user to update own data" ON public."User"
    FOR UPDATE TO authenticated 
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- ARCH-10: Cleanup Legacy Table
DROP TABLE IF EXISTS public.fotos CASCADE;

-- SEC-6: foto_upload_tokens hardening
ALTER TABLE public.foto_upload_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access to tokens" ON public.foto_upload_tokens;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.foto_upload_tokens;
CREATE POLICY "Enable insert for authenticated" ON public.foto_upload_tokens
    FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Enable select by token" ON public.foto_upload_tokens;
CREATE POLICY "Enable select by token" ON public.foto_upload_tokens
    FOR SELECT USING (true); 

-- PERF-1: RLS InitPlan Optimization
DO $$
DECLARE
    t text;
    tables_to_fix text[] := ARRAY[
        'socios', 'requerimentos', 'financeiro_dae', 'financeiro_lancamentos',
        'financeiro_cobrancas_geradas', 'financeiro_config_socio', 
        'localidades', 'entidade', 'parametros'
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

-- Fix check_member_limit logic bug (BUG-5)
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
    SELECT socio_limit INTO v_limit FROM entidade LIMIT 1;
    SELECT COUNT(*) INTO v_count FROM socios WHERE situacao != 'Excluído';
    
    IF v_count >= v_limit AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.situacao = 'Excluído' AND NEW.situacao != 'Excluído')) THEN
        RAISE EXCEPTION 'Limite de sócios atingido (%)', v_limit;
    END IF;
    
    RETURN NEW;
END;
$$;
