-- 1. Tabela de Auditoria Financeira
CREATE TABLE IF NOT EXISTS public.audit_log_financeiro (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    operation text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    changed_by uuid REFERENCES public."User"(id),
    created_at timestamptz DEFAULT now()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.audit_log_financeiro ENABLE ROW LEVEL SECURITY;

-- Politica simples: Apenas admins podem ver auditoria
DROP POLICY IF EXISTS "Admins podem ver auditoria" ON public.audit_log_financeiro;
CREATE POLICY "Admins podem ver auditoria" ON public.audit_log_financeiro
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public."User" WHERE id = auth.uid() AND role = 'admin'));

-- 2. Funcao de Trigger de Auditoria
CREATE OR REPLACE FUNCTION public.proc_audit_finance_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_log_financeiro (
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        changed_by
    )
    VALUES (
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        TG_OP,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
        auth.uid()
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Aplicacao do Trigger nas Tabelas Sensiveis
-- Configuracoes Financeiras
DROP TRIGGER IF EXISTS tr_audit_parametros_financeiros ON public.parametros_financeiros;
CREATE TRIGGER tr_audit_parametros_financeiros
AFTER INSERT OR UPDATE OR DELETE ON public.parametros_financeiros
FOR EACH ROW EXECUTE FUNCTION public.proc_audit_finance_change();

-- Tipos de Cobranca
DROP TRIGGER IF EXISTS tr_audit_tipos_cobranca ON public.tipos_cobranca;
CREATE TRIGGER tr_audit_tipos_cobranca
AFTER INSERT OR UPDATE OR DELETE ON public.tipos_cobranca
FOR EACH ROW EXECUTE FUNCTION public.proc_audit_finance_change();

-- 4. RPC de Cancelamento Atomico (M-05)
-- Esta RPC garante que o cancelamento do lancamento e a reversao da cobranca vinculada ocorram na mesma transacao.
CREATE OR REPLACE FUNCTION public.cancel_payment_v1(
    p_id uuid,
    p_obs text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_socio_cpf text;
    v_lancamento_tipo text;
BEGIN
    -- 1. Verificar se o lancamento existe e se o status permite cancelamento
    IF NOT EXISTS (
        SELECT 1 FROM public.financeiro_lancamentos 
        WHERE id = p_id AND status != 'cancelado'
    ) THEN
        RAISE EXCEPTION 'Lancamento nao encontrado ou ja cancelado.';
    END IF;

    -- Capturar dados para auditoria interna (opcional) ou logica condicional
    SELECT socio_cpf, tipo INTO v_socio_cpf, v_lancamento_tipo 
    FROM public.financeiro_lancamentos WHERE id = p_id;

    -- 2. Marcar lancamento como cancelado
    UPDATE public.financeiro_lancamentos
    SET 
        status = 'cancelado',
        cancelado_em = now(),
        cancelado_por = auth.uid(),
        cancelamento_obs = p_obs,
        updated_at = now()
    WHERE id = p_id;

    -- 3. Reverter cobranca gerada (se houver vinculo via lancamento_id)
    -- Ao cancelar o pagamento, a cobranca original volta a ficar 'pendente' 
    -- para que o associado continue devendo aquele valor.
    UPDATE public.financeiro_cobrancas_geradas
    SET 
        status = 'pendente',
        lancamento_id = NULL,
        updated_at = now()
    WHERE lancamento_id = p_id;

    -- 4. Registrar no log de auditoria (operacao manual)
    INSERT INTO public.audit_log_financeiro (
        table_name,
        record_id,
        operation,
        new_data,
        changed_by
    )
    VALUES (
        'financeiro_lancamentos',
        p_id,
        'CANCEL_PAYMENT',
        jsonb_build_object('obs', p_obs, 'socio', v_socio_cpf, 'tipo', v_lancamento_tipo),
        auth.uid()
    );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
