-- Migration: 20260422_ph4_branding_redesign
-- Objetivo: Mover dados de aparencia/tema para configuracao_entidade e preparar suporte a Logo dinamico via Path.

DO $$ 
BEGIN
    -- 1. Garantir que o bucket de branding existe
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('branding', 'branding', true)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Adicionar colunas em configuracao_entidade se nao existirem
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'configuracao_entidade' AND COLUMN_NAME = 'cor_primaria') THEN
        ALTER TABLE public.configuracao_entidade ADD COLUMN cor_primaria text NOT NULL DEFAULT '160 84% 39%';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'configuracao_entidade' AND COLUMN_NAME = 'cor_secundaria') THEN
        ALTER TABLE public.configuracao_entidade ADD COLUMN cor_secundaria text NOT NULL DEFAULT '152 69% 41%';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'configuracao_entidade' AND COLUMN_NAME = 'cor_sidebar') THEN
        ALTER TABLE public.configuracao_entidade ADD COLUMN cor_sidebar text NOT NULL DEFAULT '160 84% 39%';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'configuracao_entidade' AND COLUMN_NAME = 'logo_path') THEN
        ALTER TABLE public.configuracao_entidade ADD COLUMN logo_path text;
    END IF;

    -- 3. Migrar dados de cores existentes da tabela entidade
    -- Como cada tenant tem seu proprio banco e apenas 1 linha em entidade/configuracao_entidade, 
    -- o join implicito sem WHERE e seguro.
    UPDATE public.configuracao_entidade ce
    SET 
        cor_primaria = e.cor_primaria,
        cor_secundaria = e.cor_secundaria,
        cor_sidebar = e.cor_sidebar
    FROM public.entidade e;

    -- 4. Remover colunas obsoletas de entidade
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entidade' AND COLUMN_NAME = 'cor_primaria') THEN
        ALTER TABLE public.entidade DROP COLUMN cor_primaria;
    END IF;

    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entidade' AND COLUMN_NAME = 'cor_secundaria') THEN
        ALTER TABLE public.entidade DROP COLUMN cor_secundaria;
    END IF;

    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entidade' AND COLUMN_NAME = 'cor_sidebar') THEN
        ALTER TABLE public.entidade DROP COLUMN cor_sidebar;
    END IF;

    -- Limpeza de colunas criadas erroneamente na sessao anterior
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entidade' AND COLUMN_NAME = 'logo_url') THEN
        ALTER TABLE public.entidade DROP COLUMN logo_url;
    END IF;

    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entidade' AND COLUMN_NAME = 'favicon_url') THEN
        ALTER TABLE public.entidade DROP COLUMN favicon_url;
    END IF;

END $$;

-- 5. Politicas de RLS para o Bucket Branding
-- Remove politicas antigas se existirem para evitar conflitos
DROP POLICY IF EXISTS "Acesso publico para visualizacao de branding" ON storage.objects;
DROP POLICY IF EXISTS "Acesso total para usuarios autenticados no branding" ON storage.objects;

-- Permite que qualquer pessoa visualize a logo
CREATE POLICY "Acesso publico para visualizacao de branding"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

-- Permite que usuarios autenticados gerenciem os arquivos
CREATE POLICY "Acesso total para usuarios autenticados no branding"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'branding')
WITH CHECK (bucket_id = 'branding');

-- 6. Politicas de RLS para a Tabela configuracao_entidade
-- Permite leitura e escrita para usuarios autenticados
DROP POLICY IF EXISTS "Permitir leitura para todos autenticados" ON public.configuracao_entidade;
DROP POLICY IF EXISTS "Permitir gestao para usuarios autenticados" ON public.configuracao_entidade;

CREATE POLICY "Permitir gestao para usuarios autenticados"
ON public.configuracao_entidade FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
