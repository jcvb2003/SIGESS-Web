-- Habilitacao de Realtime para o fluxo de fotos
-- Permite que o computador receba notificacoes de UPDATE no token

-- 1. Configurar Identidade de Replica (garante que todos os dados sejam enviados no evento)
ALTER TABLE public.foto_upload_tokens REPLICA IDENTITY FULL;

-- 2. Adicionar a tabela a publicacao do Supabase
-- Usamos um bloco DO para ser resiliente a erros caso a publicacao nao exista ou a tabela ja esteja nela
DO $$
BEGIN
    -- Verifica se a publicacao padrao do Supabase existe
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        -- Tenta adicionar a tabela. Se ja estiver la, o Postgres lancara um aviso/erro ignoravel aqui
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.foto_upload_tokens;
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'Tabela ja esta na publicacao supabase_realtime';
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao adicionar tabela a publicacao: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Publicacao supabase_realtime nao encontrada. O Realtime pode nao estar ativado neste projeto.';
    END IF;
END $$;
