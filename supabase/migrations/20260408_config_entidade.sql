-- =============================================================================
-- Migration: 20260408_config_entidade
-- Objetivo: Criar tabela de configuração global e remover max_socios de User.
-- =============================================================================

-- 1. Criar a nova tabela de configuração
CREATE TABLE IF NOT EXISTS public.configuracao_entidade (
    id integer PRIMARY KEY DEFAULT 1,
    max_socios integer DEFAULT 100,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Habilitar RLS
ALTER TABLE public.configuracao_entidade ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Permitir leitura para todos autenticados" ON public.configuracao_entidade;
CREATE POLICY "Permitir leitura para todos autenticados" 
ON public.configuracao_entidade FOR SELECT 
TO authenticated 
USING (true);

-- 2. Inicializar a tabela (se vazia)
INSERT INTO public.configuracao_entidade (id, max_socios)
SELECT 1, 100
WHERE NOT EXISTS (SELECT 1 FROM public.configuracao_entidade);

-- 3. Atualizar a Trigger de Limite de Sócios
-- Saneamento: Remover a função antiga que lia de public."User"
DROP FUNCTION IF EXISTS public.check_member_limit() CASCADE;

CREATE OR REPLACE FUNCTION public.check_member_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
    v_max_socios INTEGER;
    v_current_count INTEGER;
BEGIN
    -- Busca limite na nova tabela global
    SELECT max_socios INTO v_max_socios FROM public.configuracao_entidade LIMIT 1;
    
    -- Fallback de segurança
    IF v_max_socios IS NULL THEN
        v_max_socios := 5;
    END IF;

    -- Conta sócios ativos
    SELECT count(*) INTO v_current_count FROM public.socios WHERE situacao = 'Ativo';

    IF v_current_count >= v_max_socios THEN
        RAISE EXCEPTION 'Limite de sócios atingido (%)', v_max_socios;
    END IF;

    RETURN NEW;
END;
$$;

-- Recriar a trigger na tabela socios
CREATE TRIGGER tr_check_member_limit
    BEFORE INSERT ON public.socios
    FOR EACH ROW EXECUTE FUNCTION public.check_member_limit();

-- 4. Limpeza de Schema (Remover max_socios de User)
-- Nota: Fazemos isso por último para garantir que os dados legados não influenciem mais.
ALTER TABLE public."User" DROP COLUMN IF EXISTS max_socios;
