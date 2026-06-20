-- Phase 3 Round 6: suporte a lançamentos pendentes (gerados por cobrança externa em lote)
-- data_pagamento real só é preenchida pelo webhook PAYMENT_RECEIVED (não no momento da criação)

-- 1. Adicionar 'pendente' ao CHECK de status
ALTER TABLE public.financeiro_lancamentos
  DROP CONSTRAINT IF EXISTS financeiro_lancamentos_status_check;

ALTER TABLE public.financeiro_lancamentos
  ADD CONSTRAINT financeiro_lancamentos_status_check
  CHECK (status = ANY (ARRAY['pago'::text, 'cancelado'::text, 'pendente'::text]));

-- 2. Permitir data_pagamento null (lançamentos pendentes ainda não foram pagos)
-- Usando ALTER COLUMN para evitar dependência de nome de constraint autogenerado
ALTER TABLE public.financeiro_lancamentos
  ALTER COLUMN data_pagamento DROP NOT NULL,
  ALTER COLUMN data_pagamento DROP DEFAULT;
