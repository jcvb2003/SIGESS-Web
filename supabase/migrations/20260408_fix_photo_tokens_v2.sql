-- Correcao de regressao no fluxo de fotos
-- Remove a FK de foto_upload_tokens para permitir QR Code em novos cadastros
-- Alinha a RPC confirmar_upload_foto com o app mobile (Base64)

-- 1. Remover FK restritiva
ALTER TABLE public.foto_upload_tokens DROP CONSTRAINT IF EXISTS foto_upload_tokens_socio_cpf_fkey;

-- 2. Garantir que a RPC suporte o parametro p_base64 (versao mobile)
-- Deleta a versao antiga para evitar erro de mudanca de nome de parametro
DROP FUNCTION IF EXISTS public.confirmar_upload_foto(uuid, text);

CREATE OR REPLACE FUNCTION public.confirmar_upload_foto(p_token uuid, p_base64 text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 AS $function$
BEGIN
  UPDATE public.foto_upload_tokens
  SET 
    foto_base64 = p_base64,
    used = true
  WHERE token = p_token
    AND used = false
    AND expires_at > now();

  RETURN FOUND;
END;
$function$;

-- 3. Garantir existencia do bucket fotos
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('fotos', 'fotos', true, NULL)
ON CONFLICT (id) DO NOTHING;

-- 4. Garantir politicas de RLS para o bucket fotos
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'fotos');
    
    DROP POLICY IF EXISTS "Acesso total para usuarios autenticados_fotos" ON storage.objects;
    CREATE POLICY "Acesso total para usuarios autenticados_fotos" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'fotos');
END $$;
