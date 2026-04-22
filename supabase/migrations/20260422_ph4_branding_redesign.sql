-- Migration: 20260422_ph4_branding_redesign
-- Objetivo: Mover dados de aparência/tema para configuracao_entidade e preparar suporte a Logo dinâmico via Path.

DO $$ 
BEGIN
    -- 1. Garantir que o bucket de branding existe
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('branding', 'branding', true)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Adicionar colunas em configuracao_entidade se não existirem
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
    -- Como cada tenant tem seu próprio banco e apenas 1 linha em entidade/configuracao_entidade, 
    -- o join implícito sem WHERE é seguro.
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

    -- Limpeza de colunas criadas erroneamente na sessão anterior
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entidade' AND COLUMN_NAME = 'logo_url') THEN
        ALTER TABLE public.entidade DROP COLUMN logo_url;
    END IF;

    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entidade' AND COLUMN_NAME = 'favicon_url') THEN
        ALTER TABLE public.entidade DROP COLUMN favicon_url;
    END IF;

END $$;

-- 5. Políticas de RLS para o Bucket Branding
-- Remove políticas antigas se existirem para evitar conflitos
DROP POLICY IF EXISTS "Acesso público para visualização de branding" ON storage.objects;
DROP POLICY IF EXISTS "Acesso total para usuários autenticados no branding" ON storage.objects;

-- Permite que qualquer pessoa visualize a logo
CREATE POLICY "Acesso público para visualização de branding"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

-- Permite que usuários autenticados gerenciem os arquivos
CREATE POLICY "Acesso total para usuários autenticados no branding"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'branding')
WITH CHECK (bucket_id = 'branding');

-- 6. Políticas de RLS para a Tabela configuracao_entidade
-- Permite leitura e escrita para usuários autenticados
DROP POLICY IF EXISTS "Permitir leitura para todos autenticados" ON public.configuracao_entidade;
DROP POLICY IF EXISTS "Permitir gestão para usuários autenticados" ON public.configuracao_entidade;

CREATE POLICY "Permitir gestão para usuários autenticados"
ON public.configuracao_entidade FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
