-- Corrige RLS de configuracao_recebimento: escrita permitida ao presidente
-- Regra de negócio: quem opera o sistema é o operador; neste fluxo, somente o presidente.
-- owner não tem papel operacional nesta feature.
DROP POLICY IF EXISTS "cfg_recebimento_write_owner" ON public.configuracao_recebimento;

CREATE POLICY "cfg_recebimento_write_presidente"
  ON public.configuracao_recebimento FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.user_id = auth.uid()
        AND tu.is_active = true
        AND tu.tenant_id = configuracao_recebimento.tenant_id
        AND tu.operator_type = 'presidente'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.user_id = auth.uid()
        AND tu.is_active = true
        AND tu.tenant_id = configuracao_recebimento.tenant_id
        AND tu.operator_type = 'presidente'
    )
  );
