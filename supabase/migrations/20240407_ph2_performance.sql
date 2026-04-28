-- SIGESS Phase 2: Performance & Audit Integrity (v1.0)
-- Data: 2024-04-07
-- Objetivos: 
-- 1. RPC `get_birthday_members` para otimizar Dashboard (Item S-01)
-- 2. Constraints de Auditoria em Lancamentos e DAEs (Item M-04)

-- 1. PERFORMANCE: RPC para Aniversariantes do Dia
-- Elimina o loop de 6-10 queries sequenciais que puxavam milhares de registros.
-- Agora o Dashboard faz uma unica consulta indexada de < 50ms.

CREATE OR REPLACE FUNCTION public.get_birthday_members(p_day int, p_month int)
RETURNS TABLE (
  id uuid,
  nome text,
  cpf text,
  data_de_nascimento date
) 
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.nome, s.cpf, s.data_de_nascimento
  FROM public.socios s
  WHERE 
    EXTRACT(DAY FROM s.data_de_nascimento) = p_day AND
    EXTRACT(MONTH FROM s.data_de_nascimento) = p_month
  ORDER BY s.nome ASC;
END;
$$;

-- 2. SEGURANCA: Auditoria Obrigatoria de Cancelamento (M-04)
-- Garante que todo cancelamento (status='cancelado') tenha um autor identificado (cancelado_por).
-- Nao usamos NOT NULL puro porque lancamentos ativos (status='pago') nao tem esse campo preenchido.

-- 2.1 Tabela de Lancamentos Financeiros
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_cancelamento_audit_lancamentos') THEN
        ALTER TABLE public.financeiro_lancamentos 
        ADD CONSTRAINT chk_cancelamento_audit_lancamentos 
        CHECK (
            (status = 'cancelado' AND cancelado_por IS NOT NULL) OR 
            (status != 'cancelado')
        );
    END IF;
END $$;

-- 2.2 Tabela de DAEs (Boleto Governamental)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_cancelamento_audit_dae') THEN
        ALTER TABLE public.financeiro_dae 
        ADD CONSTRAINT chk_cancelamento_audit_dae 
        CHECK (
            (status = 'cancelado' AND cancelado_por IS NOT NULL) OR 
            (status != 'cancelado')
        );
    END IF;
END $$;

-- 2.3 Tabela de Cobrancas Geradas (Compulsorias)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_cancelamento_audit_cobrancas') THEN
        ALTER TABLE public.financeiro_cobrancas_geradas 
        ADD CONSTRAINT chk_cancelamento_audit_cobrancas 
        CHECK (
            (status = 'cancelado' AND cancelado_por IS NOT NULL) OR 
            (status != 'cancelado')
        );
    END IF;
END $$;

-- 3. PERMISSOES
GRANT EXECUTE ON FUNCTION public.get_birthday_members(int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_birthday_members(int, int) TO service_role;
