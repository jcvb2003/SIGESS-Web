-- Migration: 20260408_config_acesso.sql
-- Goal: Moving acesso_expira_em from User to configuracao_entidade

-- 1. Add column to configuracao_entidade (Starts as NULL, will be synced from Admin)
ALTER TABLE public.configuracao_entidade 
ADD COLUMN acesso_expira_em TIMESTAMPTZ;

-- 2. Drop column from User table (Cleanup)
ALTER TABLE public."User" 
DROP COLUMN acesso_expira_em;

-- 3. Ensure the single record in configuracao_entidade exists (Defensive)
INSERT INTO public.configuracao_entidade (id, max_socios)
VALUES (1, 100)
ON CONFLICT (id) DO NOTHING;

COMMENT ON COLUMN public.configuracao_entidade.acesso_expira_em IS 'Data de expiração da licença do sindicato (centralizada)';
