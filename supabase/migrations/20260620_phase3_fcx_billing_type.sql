-- Adiciona billing_type em financeiro_cobrancas_externas
-- Necessário para reemissão preservar o canal original (BOLETO vs PIX)
-- Nullable para compatibilidade com rows criadas antes desta migration
ALTER TABLE public.financeiro_cobrancas_externas
  ADD COLUMN IF NOT EXISTS billing_type text
  CHECK (billing_type IN ('BOLETO', 'PIX'));
