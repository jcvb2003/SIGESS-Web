ALTER TABLE public.configuracao_entidade
  ADD COLUMN IF NOT EXISTS extensao_license_key TEXT DEFAULT NULL;

COMMENT ON COLUMN public.configuracao_entidade.extensao_license_key
  IS 'Chave de licenca da Extensao SIGESS vinculada a esta entidade';
