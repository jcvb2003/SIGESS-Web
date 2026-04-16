-- RPC para atualização segura da chave de licença da extensão
-- Utiliza SECURITY DEFINER para bypassar RLS da tabela configuracao_entidade
CREATE OR REPLACE FUNCTION public.update_extension_license(p_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  UPDATE public.configuracao_entidade
  SET extensao_license_key = p_key,
      updated_at = now()
  WHERE id = 1;
END;
$$;

COMMENT ON FUNCTION public.update_extension_license(text) 
  IS 'Atualiza a chave de licença da extensão SIGESS ignorando restrições de RLS (Security Definer)';
