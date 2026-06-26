-- =============================================================================
-- Propagação: p_tenant_id em get_caller_tenant_id e 16 funções dependentes
-- Origem: CLIENTES DO PARA (jatnbqspfvhvlzaoekzz) — aplicar nos outros 4 projetos
-- Projetos alvo:
--   SINPESCA OEIRAS    (tnrzxuznerneilxoojgv)
--   SINPESCA PARCEIROS (typimbftfeiqdzrwtake)
--   MARANHAO           (qatqzvyiipizqjgwqaui)
--   PARCEIROS GE       (pgzhibcioayanoecwacz)
-- Gerado em: 2026-06-26
-- =============================================================================

-- -----------------------------------------------------------------------------
-- DROP das assinaturas antigas (sem p_tenant_id) — eram overloads separados
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_caller_tenant_id();
DROP FUNCTION IF EXISTS public.cancel_payment_v1(uuid, text);
DROP FUNCTION IF EXISTS public.get_birthday_members(integer, integer, uuid);
DROP FUNCTION IF EXISTS public.get_members_by_birth_month(integer, integer, integer);
DROP FUNCTION IF EXISTS public.get_payments_by_period_paginated(date, date, integer, integer, text, text, uuid, text, text[]);
DROP FUNCTION IF EXISTS public.launch_bulk_contribution(uuid, uuid);
DROP FUNCTION IF EXISTS public.list_requirements_extended(integer, text, text, text, text, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.purge_cancelled_bulk_v1(integer);
DROP FUNCTION IF EXISTS public.reap_batch_upsert_anual_v2(jsonb);
DROP FUNCTION IF EXISTS public.reap_batch_upsert_simplificado(jsonb);
DROP FUNCTION IF EXISTS public.reap_batch_upsert_simplificado_v2(jsonb);
DROP FUNCTION IF EXISTS public.reap_upsert_anual_ano(text, text, jsonb);
DROP FUNCTION IF EXISTS public.reap_upsert_full(text, jsonb, jsonb, text);
DROP FUNCTION IF EXISTS public.reap_upsert_simplificado_ano(text, text, jsonb);
DROP FUNCTION IF EXISTS public.register_payment_session(text, uuid, text, date, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.update_dae_group(uuid, integer, jsonb);
DROP FUNCTION IF EXISTS public.update_extension_license(text, uuid);
DROP FUNCTION IF EXISTS public.update_member_regime(text, text, text);

-- 1. get_caller_tenant_id (base — deve ser aplicada primeiro)
CREATE OR REPLACE FUNCTION public.get_caller_tenant_id(p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_tenant_id uuid;
  v_count     integer;
BEGIN
  IF p_tenant_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE user_id   = (SELECT auth.uid())
        AND tenant_id = p_tenant_id
        AND is_active = true
    ) THEN
      RAISE EXCEPTION 'access denied: not a member of tenant %', p_tenant_id;
    END IF;
    RETURN p_tenant_id;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.tenant_users
  WHERE user_id = (SELECT auth.uid()) AND is_active = true;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'access denied: no active tenant membership';
  END IF;

  IF v_count > 1 THEN
    RAISE EXCEPTION 'ambiguous context: expected 1 active tenant, found %', v_count;
  END IF;

  SELECT tenant_id INTO v_tenant_id
  FROM public.tenant_users
  WHERE user_id = (SELECT auth.uid()) AND is_active = true;

  RETURN v_tenant_id;
END;
$function$;

-- 2. cancel_payment_v1
CREATE OR REPLACE FUNCTION public.cancel_payment_v1(p_id uuid, p_obs text DEFAULT NULL::text, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_socio_cpf        text;
    v_lancamento_tipo  text;
    v_target_tenant_id uuid;
    v_target_unit_id   uuid;
    v_caller_tenant_id uuid;
BEGIN
    v_caller_tenant_id := public.get_caller_tenant_id(p_tenant_id);

    SELECT l.socio_cpf, l.tipo, s.tenant_id, s.unit_id
    INTO v_socio_cpf, v_lancamento_tipo, v_target_tenant_id, v_target_unit_id
    FROM public.financeiro_lancamentos l
    JOIN public.socios s ON s.cpf = l.socio_cpf
    WHERE l.id = p_id AND l.status != 'cancelado'
    LIMIT 1;

    IF v_socio_cpf IS NULL THEN
        RAISE EXCEPTION 'Lançamento não encontrado ou já cancelado.';
    END IF;

    IF v_target_tenant_id IS DISTINCT FROM v_caller_tenant_id THEN
        RAISE EXCEPTION 'Acesso negado: lançamento fora do seu tenant.';
    END IF;

    IF NOT (
        public.is_tenant_owner(v_target_tenant_id)
        OR EXISTS (
            SELECT 1
            FROM public.tenant_users tu
            JOIN public.user_unit_memberships m
              ON m.user_id = tu.user_id AND m.tenant_id = tu.tenant_id
             AND m.unit_id = v_target_unit_id AND m.is_active = true
            WHERE tu.user_id = auth.uid()
              AND tu.tenant_id = v_target_tenant_id
              AND tu.is_active = true
              AND tu.tenant_role = 'member'
              AND tu.operator_type = 'presidente'
        )
    ) THEN
        RAISE EXCEPTION 'Acesso negado: requer privilégios administrativos da unidade.';
    END IF;

    UPDATE public.financeiro_lancamentos
    SET status = 'cancelado', cancelado_em = now(), cancelado_por = auth.uid(),
        cancelamento_obs = p_obs, updated_at = now()
    WHERE id = p_id;

    UPDATE public.financeiro_cobrancas_geradas
    SET status = 'pendente', lancamento_id = NULL, updated_at = now()
    WHERE lancamento_id = p_id;

    INSERT INTO public.audit_log_financeiro (
        table_name, record_id, operation, new_data, changed_by, tenant_id, unit_id
    ) VALUES (
        'financeiro_lancamentos', p_id, 'CANCEL_PAYMENT',
        jsonb_build_object('obs', p_obs, 'socio', v_socio_cpf, 'tipo', v_lancamento_tipo),
        auth.uid(), v_target_tenant_id, v_target_unit_id
    );
END;
$function$;

-- 3. get_birthday_members
CREATE OR REPLACE FUNCTION public.get_birthday_members(p_day integer, p_month integer, p_unit_id uuid DEFAULT NULL::uuid, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, nome text, cpf text, data_de_nascimento date)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_tenant_id uuid;
BEGIN
  v_tenant_id := public.get_caller_tenant_id(p_tenant_id);

  RETURN QUERY
  SELECT s.id, s.nome, s.cpf, s.data_de_nascimento
  FROM public.socios s
  WHERE EXTRACT(DAY   FROM s.data_de_nascimento) = p_day
    AND EXTRACT(MONTH FROM s.data_de_nascimento) = p_month
    AND s.tenant_id = v_tenant_id
    AND (p_unit_id IS NULL OR s.unit_id = p_unit_id)
  ORDER BY s.nome ASC;
END;
$function$;

-- 4. get_members_by_birth_month
CREATE OR REPLACE FUNCTION public.get_members_by_birth_month(p_month integer, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, nome text, cpf text, data_de_nascimento date, codigo_do_socio text, total_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_tenant_id uuid;
BEGIN
  v_tenant_id := public.get_caller_tenant_id(p_tenant_id);

  RETURN QUERY
  WITH filtered AS (
    SELECT s.id, s.nome, s.cpf, s.data_de_nascimento, s.codigo_do_socio
    FROM public.socios s
    WHERE EXTRACT(month FROM s.data_de_nascimento) = p_month
      AND s.tenant_id = v_tenant_id
  ),
  total AS (SELECT count(*) AS count FROM filtered)
  SELECT f.*, t.count
  FROM filtered f, total t
  ORDER BY f.nome
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- 5. get_payments_by_period_paginated
CREATE OR REPLACE FUNCTION public.get_payments_by_period_paginated(p_start_date date, p_end_date date, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0, p_order_by text DEFAULT 'data_pagamento'::text, p_order_dir text DEFAULT 'DESC'::text, p_unit_id uuid DEFAULT NULL::uuid, p_search text DEFAULT NULL::text, p_types text[] DEFAULT NULL::text[], p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, data_pagamento date, tipo text, tipo_exibicao text, competencia_ano integer, competencia_mes integer, forma_pagamento text, valor numeric, created_at timestamp with time zone, socio_nome text, socio_cpf text, total_count bigint, total_amount numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_tenant_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    v_tenant_id := public.get_caller_tenant_id(p_tenant_id);
  ELSIF p_unit_id IS NOT NULL THEN
    SELECT tu.tenant_id INTO v_tenant_id
    FROM public.tenant_units tu WHERE tu.id = p_unit_id;
    IF v_tenant_id IS NULL THEN
      RAISE EXCEPTION 'unit_id nao encontrado ou invalido';
    END IF;
  ELSE
    RAISE EXCEPTION 'contexto de tenant necessario: chamar como usuario autenticado ou fornecer unit_id';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      fl.id,
      fl.data_pagamento,
      fl.tipo,
      CASE
        WHEN fl.tipo IN ('contribuicao', 'cadastro_governamental') THEN
          COALESCE(
            NULLIF(BTRIM(fl.descricao), ''),
            NULLIF(BTRIM(tc.nome), ''),
            CASE fl.tipo
              WHEN 'contribuicao'           THEN 'Contribuicao'
              WHEN 'cadastro_governamental' THEN 'Cadastro governamental'
              ELSE fl.tipo
            END
          )
        ELSE
          CASE fl.tipo
            WHEN 'anuidade'      THEN 'Anuidade'
            WHEN 'mensalidade'   THEN 'Mensalidade'
            WHEN 'inicial'       THEN 'Taxa inicial'
            WHEN 'transferencia' THEN 'Transferencia'
            ELSE fl.tipo
          END
      END AS tipo_exibicao,
      fl.competencia_ano,
      fl.competencia_mes,
      fl.forma_pagamento,
      fl.valor,
      fl.created_at,
      s.nome AS socio_nome,
      s.cpf  AS socio_cpf
    FROM public.financeiro_lancamentos fl
    JOIN public.socios s ON s.cpf = fl.socio_cpf
    LEFT JOIN public.tipos_cobranca tc ON tc.id = fl.tipo_cobranca_id
    WHERE fl.status         = 'pago'
      AND fl.data_pagamento >= p_start_date
      AND fl.data_pagamento <= p_end_date
      AND s.tenant_id        = v_tenant_id
      AND (p_unit_id IS NULL OR s.unit_id = p_unit_id)
      AND (p_types IS NULL OR cardinality(p_types) = 0 OR fl.tipo = ANY(p_types))
      AND (
        p_search IS NULL OR BTRIM(p_search) = ''
        OR s.nome  ILIKE '%' || p_search || '%'
        OR s.cpf   ILIKE '%' || p_search || '%'
        OR fl.tipo ILIKE '%' || p_search || '%'
        OR COALESCE(NULLIF(BTRIM(fl.descricao), ''), NULLIF(BTRIM(tc.nome), ''))
           ILIKE '%' || p_search || '%'
      )
  ),
  stats AS (SELECT count(*) AS count, sum(base.valor) AS amount FROM base)
  SELECT
    b.id, b.data_pagamento, b.tipo, b.tipo_exibicao,
    b.competencia_ano, b.competencia_mes, b.forma_pagamento,
    b.valor, b.created_at, b.socio_nome, b.socio_cpf,
    st.count  AS total_count,
    st.amount AS total_amount
  FROM base b, stats st
  ORDER BY
    CASE WHEN p_order_by = 'data_pagamento' AND p_order_dir = 'ASC'  THEN b.data_pagamento END ASC,
    CASE WHEN p_order_by = 'data_pagamento' AND p_order_dir = 'DESC' THEN b.data_pagamento END DESC,
    CASE WHEN p_order_by = 'created_at'     AND p_order_dir = 'ASC'  THEN b.created_at     END ASC,
    CASE WHEN p_order_by = 'created_at'     AND p_order_dir = 'DESC' THEN b.created_at     END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- 6. launch_bulk_contribution
CREATE OR REPLACE FUNCTION public.launch_bulk_contribution(p_tipo_cobranca_id uuid, p_unit_id uuid DEFAULT NULL::uuid, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_valor     numeric(10,2);
  v_count     integer := 0;
  v_tenant_id uuid;
BEGIN
  v_tenant_id := public.get_caller_tenant_id(p_tenant_id);

  SELECT valor_padrao INTO v_valor
  FROM public.tipos_cobranca
  WHERE id              = p_tipo_cobranca_id
    AND tenant_id       = v_tenant_id
    AND categoria       = 'contribuicao'
    AND obrigatoriedade = 'compulsoria'
    AND ativo           = true;

  IF v_valor IS NULL THEN
    RAISE EXCEPTION 'Tipo de cobranca invalido, nao pertence ao seu tenant ou sem valor padrao definido';
  END IF;

  INSERT INTO public.financeiro_cobrancas_geradas (tipo_cobranca_id, socio_cpf, valor)
  SELECT p_tipo_cobranca_id, s.cpf, v_valor
  FROM public.socios s
  WHERE s.situacao  = 'ATIVO'
    AND s.tenant_id = v_tenant_id
    AND (p_unit_id IS NULL OR s.unit_id = p_unit_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.financeiro_cobrancas_geradas cg
      WHERE cg.tipo_cobranca_id = p_tipo_cobranca_id AND cg.socio_cpf = s.cpf
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

-- 7. list_requirements_extended
CREATE OR REPLACE FUNCTION public.list_requirements_extended(p_ano integer, p_status text DEFAULT 'all'::text, p_beneficio text DEFAULT 'all'::text, p_search text DEFAULT ''::text, p_carencia text DEFAULT 'all'::text, p_page integer DEFAULT 1, p_page_size integer DEFAULT 10, p_unit_id uuid DEFAULT NULL::uuid, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, socio_id uuid, cod_req text, data_assinatura date, cpf text, ano_referencia integer, status_mte text, data_envio date, num_req_mte text, created_at timestamp with time zone, updated_at timestamp with time zone, beneficio_recebido boolean, socio_nome text, socio_nit text, socio_num_rgp text, socio_emissao_rgp date, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_offset       integer;
  v_defeso_start date;
  v_tenant_id    uuid;
BEGIN
  v_offset       := (p_page - 1) * p_page_size;
  v_defeso_start := make_date(p_ano, 11, 15);
  v_tenant_id    := public.get_caller_tenant_id(p_tenant_id);

  RETURN QUERY
  WITH filtered_data AS (
    SELECT
      r.id                                             AS requirement_id,
      s.id                                             AS member_id,
      r.cod_req,
      r.data_assinatura,
      s.cpf,
      COALESCE(r.ano_referencia, p_ano)                AS ano_referencia,
      COALESCE(r.status_mte, 'nao_assinado')           AS status_mte,
      r.data_envio,
      r.num_req_mte,
      r.created_at,
      r.updated_at,
      COALESCE(r.beneficio_recebido, false)            AS beneficio_recebido,
      s.nome                                            AS socio_nome,
      s.nit                                             AS socio_nit,
      s.num_rgp                                         AS socio_num_rgp,
      s.emissao_rgp                                     AS socio_emissao_rgp
    FROM public.socios s
    LEFT JOIN public.requerimentos r ON s.cpf = r.cpf AND r.ano_referencia = p_ano
    WHERE s.tenant_id = v_tenant_id
      AND (p_unit_id IS NULL OR s.unit_id = p_unit_id)
      AND (
        p_status = 'all'
        OR (CASE WHEN p_status = 'nao_assinado' THEN r.id IS NULL
                 ELSE r.status_mte = p_status END)
      )
      AND (
        p_beneficio = 'all'
        OR (CASE WHEN p_beneficio = 'recebido' THEN r.beneficio_recebido IS TRUE
                 ELSE r.beneficio_recebido IS FALSE OR r.beneficio_recebido IS NULL END)
      )
      AND (
        p_search = ''
        OR s.cpf     ILIKE '%' || p_search || '%'
        OR s.nome    ILIKE '%' || p_search || '%'
        OR r.cod_req ILIKE '%' || p_search || '%'
      )
      AND (
        CASE
          WHEN p_carencia = 'com_carencia'
               THEN s.emissao_rgp <= v_defeso_start - INTERVAL '1 year'
          WHEN p_carencia = 'sem_carencia'
               THEN s.emissao_rgp >  v_defeso_start - INTERVAL '1 year'
                 OR s.emissao_rgp IS NULL
          ELSE TRUE
        END
      )
  )
  SELECT
    fd.requirement_id, fd.member_id, fd.cod_req, fd.data_assinatura,
    fd.cpf, fd.ano_referencia, fd.status_mte, fd.data_envio,
    fd.num_req_mte, fd.created_at, fd.updated_at, fd.beneficio_recebido,
    fd.socio_nome, fd.socio_nit, fd.socio_num_rgp, fd.socio_emissao_rgp,
    count(*) OVER() AS total_count
  FROM filtered_data fd
  ORDER BY fd.created_at DESC NULLS LAST, fd.socio_nome ASC
  LIMIT p_page_size
  OFFSET v_offset;
END;
$function$;

-- 8. purge_cancelled_bulk_v1
CREATE OR REPLACE FUNCTION public.purge_cancelled_bulk_v1(p_older_than_days integer, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_count     int;
    v_tenant_id uuid;
BEGIN
    v_tenant_id := public.get_caller_tenant_id(p_tenant_id);

    IF NOT EXISTS (
        SELECT 1 FROM public.tenant_users tu
        WHERE tu.user_id   = auth.uid()
          AND tu.tenant_id = v_tenant_id
          AND tu.is_active = true
          AND (tu.tenant_role = 'owner' OR tu.operator_type = 'presidente')
    ) THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de administrador.';
    END IF;

    INSERT INTO public.audit_log_financeiro (
        table_name, record_id, operation, old_data, changed_by, tenant_id, unit_id
    )
    SELECT 'financeiro_lancamentos', l.id, 'PURGE_BULK', to_jsonb(l.*),
           auth.uid(), s.tenant_id, s.unit_id
    FROM public.financeiro_lancamentos l
    JOIN public.socios s ON s.cpf = l.socio_cpf
    WHERE s.tenant_id = v_tenant_id
      AND l.status    = 'cancelado'
      AND l.cancelado_em < (now() - (p_older_than_days || ' days')::interval);

    UPDATE public.financeiro_cobrancas_geradas c
    SET lancamento_id = NULL
    WHERE c.lancamento_id IN (
        SELECT l.id FROM public.financeiro_lancamentos l
        JOIN public.socios s ON s.cpf = l.socio_cpf
        WHERE s.tenant_id = v_tenant_id
          AND l.status    = 'cancelado'
          AND l.cancelado_em < (now() - (p_older_than_days || ' days')::interval)
    );

    WITH deleted AS (
        DELETE FROM public.financeiro_lancamentos l
        USING public.socios s
        WHERE s.cpf = l.socio_cpf
          AND s.tenant_id = v_tenant_id
          AND l.status    = 'cancelado'
          AND l.cancelado_em < (now() - (p_older_than_days || ' days')::interval)
        RETURNING l.id
    )
    SELECT count(*) INTO v_count FROM deleted;

    RETURN v_count;
END;
$function$;

-- 9. reap_batch_upsert_anual_v2
CREATE OR REPLACE FUNCTION public.reap_batch_upsert_anual_v2(p_entries jsonb, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  entry       jsonb;
  v_tenant_id uuid;
  v_cpf       text;
  v_anual     jsonb;
  v_ano       text;
  v_ano_data  jsonb;
BEGIN
  v_tenant_id := public.get_caller_tenant_id(p_tenant_id);

  FOR entry IN SELECT * FROM jsonb_array_elements(p_entries)
  LOOP
    v_cpf   := entry->>'cpf';
    v_anual := entry->'anual';

    IF v_cpf IS NULL OR btrim(v_cpf) = '' THEN
      RAISE EXCEPTION 'CPF obrigatorio no lote REAP anual';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.socios s
      WHERE s.cpf = v_cpf AND s.tenant_id = v_tenant_id
    ) THEN
      RAISE EXCEPTION 'CPF % nao pertence ao tenant autenticado', v_cpf;
    END IF;

    INSERT INTO public.reap (cpf, anual)
    VALUES (v_cpf, v_anual)
    ON CONFLICT (cpf) DO NOTHING;

    FOR v_ano, v_ano_data IN SELECT * FROM jsonb_each(v_anual)
    LOOP
      UPDATE public.reap
      SET
        anual = anual || jsonb_build_object(
          v_ano,
          COALESCE(anual -> v_ano, '{"enviado": false, "tem_problema": false, "data_envio": null, "obs": null}'::jsonb) || v_ano_data
        ),
        updated_at = now()
      WHERE cpf = v_cpf;
    END LOOP;
  END LOOP;
END;
$function$;

-- 10. reap_batch_upsert_simplificado
CREATE OR REPLACE FUNCTION public.reap_batch_upsert_simplificado(p_entries jsonb, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  entry       jsonb;
  v_tenant_id uuid;
  v_cpf       text;
BEGIN
  v_tenant_id := public.get_caller_tenant_id(p_tenant_id);

  FOR entry IN SELECT * FROM jsonb_array_elements(p_entries)
  LOOP
    v_cpf := entry->>'cpf';

    IF v_cpf IS NULL OR btrim(v_cpf) = '' THEN
      RAISE EXCEPTION 'CPF obrigatorio no lote REAP simplificado';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.socios s
      WHERE s.cpf = v_cpf AND s.tenant_id = v_tenant_id
    ) THEN
      RAISE EXCEPTION 'CPF % nao pertence ao tenant autenticado', v_cpf;
    END IF;

    INSERT INTO public.reap (cpf, simplificado, updated_at)
    VALUES (v_cpf, entry->'simplificado', now())
    ON CONFLICT (cpf) DO UPDATE
    SET simplificado = public.reap.simplificado || (entry->'simplificado'),
        updated_at   = now();
  END LOOP;
END;
$function$;

-- 11. reap_batch_upsert_simplificado_v2
CREATE OR REPLACE FUNCTION public.reap_batch_upsert_simplificado_v2(p_entries jsonb, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  entry          jsonb;
  v_tenant_id    uuid;
  v_cpf          text;
  v_simplificado jsonb;
  v_ano          text;
  v_ano_data     jsonb;
BEGIN
  v_tenant_id := public.get_caller_tenant_id(p_tenant_id);

  FOR entry IN SELECT * FROM jsonb_array_elements(p_entries)
  LOOP
    v_cpf          := entry->>'cpf';
    v_simplificado := entry->'simplificado';

    IF v_cpf IS NULL OR btrim(v_cpf) = '' THEN
      RAISE EXCEPTION 'CPF obrigatorio no lote REAP simplificado';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.socios s
      WHERE s.cpf = v_cpf AND s.tenant_id = v_tenant_id
    ) THEN
      RAISE EXCEPTION 'CPF % nao pertence ao tenant autenticado', v_cpf;
    END IF;

    INSERT INTO public.reap (cpf, simplificado)
    VALUES (v_cpf, v_simplificado)
    ON CONFLICT (cpf) DO NOTHING;

    FOR v_ano, v_ano_data IN SELECT * FROM jsonb_each(v_simplificado)
    LOOP
      UPDATE public.reap
      SET
        simplificado = simplificado || jsonb_build_object(
          v_ano,
          COALESCE(simplificado -> v_ano, '{"enviado": false, "tem_problema": false, "obs": null}'::jsonb) || v_ano_data
        ),
        updated_at = now()
      WHERE cpf = v_cpf;
    END LOOP;
  END LOOP;
END;
$function$;

-- 12. reap_upsert_anual_ano
CREATE OR REPLACE FUNCTION public.reap_upsert_anual_ano(p_cpf text, p_ano text, p_data jsonb, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_tenant_id uuid;
BEGIN
  v_tenant_id := public.get_caller_tenant_id(p_tenant_id);

  IF NOT EXISTS (
    SELECT 1 FROM public.socios s
    WHERE s.cpf = p_cpf AND s.tenant_id = v_tenant_id
  ) THEN
    RAISE EXCEPTION 'CPF % nao pertence ao tenant autenticado', p_cpf;
  END IF;

  INSERT INTO public.reap (cpf, anual, updated_at)
  VALUES (p_cpf, jsonb_build_object(p_ano, p_data), now())
  ON CONFLICT (cpf) DO UPDATE
  SET
    anual = public.reap.anual || jsonb_build_object(
      p_ano,
      COALESCE(public.reap.anual -> p_ano,
        '{"enviado": false, "data_envio": null, "tem_problema": false, "obs": null}'::jsonb) || p_data
    ),
    updated_at = now();
END;
$function$;

-- 13. reap_upsert_full
CREATE OR REPLACE FUNCTION public.reap_upsert_full(p_cpf text, p_simplificado jsonb, p_anual jsonb, p_observacoes text DEFAULT NULL::text, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_tenant_id uuid;
BEGIN
  v_tenant_id := public.get_caller_tenant_id(p_tenant_id);

  IF NOT EXISTS (
    SELECT 1 FROM public.socios s
    WHERE s.cpf = p_cpf AND s.tenant_id = v_tenant_id
  ) THEN
    RAISE EXCEPTION 'CPF % nao pertence ao tenant autenticado', p_cpf;
  END IF;

  INSERT INTO public.reap (cpf, simplificado, anual, observacoes, updated_at)
  VALUES (p_cpf, p_simplificado, p_anual, p_observacoes, now())
  ON CONFLICT (cpf) DO UPDATE
  SET simplificado = EXCLUDED.simplificado,
      anual        = EXCLUDED.anual,
      observacoes  = EXCLUDED.observacoes,
      updated_at   = now();
END;
$function$;

-- 14. reap_upsert_simplificado_ano
CREATE OR REPLACE FUNCTION public.reap_upsert_simplificado_ano(p_cpf text, p_ano text, p_data jsonb, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_tenant_id uuid;
BEGIN
  v_tenant_id := public.get_caller_tenant_id(p_tenant_id);

  IF NOT EXISTS (
    SELECT 1 FROM public.socios s
    WHERE s.cpf = p_cpf AND s.tenant_id = v_tenant_id
  ) THEN
    RAISE EXCEPTION 'CPF % nao pertence ao tenant autenticado', p_cpf;
  END IF;

  INSERT INTO public.reap (cpf, simplificado, updated_at)
  VALUES (p_cpf, jsonb_build_object(p_ano, p_data), now())
  ON CONFLICT (cpf) DO UPDATE
  SET
    simplificado = public.reap.simplificado || jsonb_build_object(
      p_ano,
      COALESCE(public.reap.simplificado -> p_ano,
        '{"enviado": false, "tem_problema": false, "obs": null}'::jsonb) || p_data
    ),
    updated_at = now();
END;
$function$;

-- 15. register_payment_session
CREATE OR REPLACE FUNCTION public.register_payment_session(p_socio_cpf text, p_sessao_id uuid, p_forma_pagamento text, p_data_pagamento date, p_itens jsonb, p_daes jsonb DEFAULT '[]'::jsonb, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_item       jsonb;
  v_dae        jsonb;
  v_daes_array jsonb := COALESCE(p_daes, '[]'::jsonb);
  v_user_id    uuid  := auth.uid();
  v_grupo_id   uuid  := NULL;
  v_tenant_id  uuid;
BEGIN
  v_tenant_id := public.get_caller_tenant_id(p_tenant_id);

  IF NOT EXISTS (
    SELECT 1 FROM public.socios s
    WHERE s.cpf = p_socio_cpf AND s.tenant_id = v_tenant_id
  ) THEN
    RAISE EXCEPTION 'access denied: CPF % does not belong to your tenant', p_socio_cpf;
  END IF;

  IF jsonb_array_length(v_daes_array) > 0 THEN
    IF (v_daes_array->0->>'tipo_boleto') != 'unitario' THEN
      v_grupo_id := gen_random_uuid();
    END IF;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    INSERT INTO public.financeiro_lancamentos (
      socio_cpf, sessao_id, tipo, valor, forma_pagamento,
      data_pagamento, competencia_ano, competencia_mes,
      tipo_cobranca_id, descricao, registrado_por
    ) VALUES (
      p_socio_cpf, p_sessao_id,
      (v_item->>'tipo'),
      (v_item->>'valor')::numeric,
      p_forma_pagamento, p_data_pagamento,
      (v_item->>'competencia_ano')::integer,
      (v_item->>'competencia_mes')::integer,
      CASE WHEN (v_item->>'tipo_cobranca_id') = '' THEN NULL
           ELSE (v_item->>'tipo_cobranca_id')::uuid END,
      (v_item->>'descricao'),
      v_user_id
    );

    IF (v_item->>'tipo_cobranca_id') IS NOT NULL AND (v_item->>'tipo_cobranca_id') != '' THEN
      UPDATE public.financeiro_cobrancas_geradas
      SET status        = 'pago',
          lancamento_id = (
            SELECT id FROM public.financeiro_lancamentos
            WHERE sessao_id        = p_sessao_id
              AND tipo_cobranca_id = (v_item->>'tipo_cobranca_id')::uuid
            ORDER BY created_at DESC LIMIT 1
          ),
          updated_at = now()
      WHERE socio_cpf        = p_socio_cpf
        AND tipo_cobranca_id = (v_item->>'tipo_cobranca_id')::uuid
        AND status           = 'pendente';
    END IF;
  END LOOP;

  FOR v_dae IN SELECT * FROM jsonb_array_elements(v_daes_array)
  LOOP
    INSERT INTO public.financeiro_dae (
      socio_cpf, sessao_id, tipo_boleto, competencia_ano,
      competencia_mes, valor, forma_pagamento, registrado_por,
      data_recebimento, grupo_id
    ) VALUES (
      p_socio_cpf, p_sessao_id,
      (v_dae->>'tipo_boleto'),
      (v_dae->>'competencia_ano')::integer,
      (v_dae->>'competencia_mes')::integer,
      (v_dae->>'valor')::numeric,
      p_forma_pagamento, v_user_id, p_data_pagamento,
      CASE WHEN (v_dae->>'tipo_boleto') = 'unitario' THEN NULL ELSE v_grupo_id END
    );
  END LOOP;
END;
$function$;

-- 16. update_dae_group
CREATE OR REPLACE FUNCTION public.update_dae_group(p_grupo_id uuid, p_new_year integer, p_items jsonb, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_novo_grupo_id    uuid := gen_random_uuid();
  v_membro_base      record;
  v_item             jsonb;
  v_target_tenant_id uuid;
  v_target_unit_id   uuid;
  v_caller_tenant_id uuid;
BEGIN
  v_caller_tenant_id := public.get_caller_tenant_id(p_tenant_id);

  SELECT d.socio_cpf, d.sessao_id, d.tipo_boleto, d.forma_pagamento, d.data_recebimento,
         s.tenant_id, s.unit_id
  INTO v_membro_base
  FROM public.financeiro_dae d
  JOIN public.socios s ON s.cpf = d.socio_cpf
  WHERE d.grupo_id = p_grupo_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Grupo não encontrado: %', p_grupo_id;
  END IF;

  v_target_tenant_id := v_membro_base.tenant_id;
  v_target_unit_id   := v_membro_base.unit_id;

  IF v_target_tenant_id IS DISTINCT FROM v_caller_tenant_id THEN
    RAISE EXCEPTION 'Acesso negado: grupo fora do seu tenant.';
  END IF;

  IF NOT (
    public.is_tenant_owner(v_target_tenant_id)
    OR EXISTS (
      SELECT 1
      FROM public.tenant_users tu
      JOIN public.user_unit_memberships m
        ON m.user_id = tu.user_id AND m.tenant_id = tu.tenant_id
       AND m.unit_id = v_target_unit_id AND m.is_active = true
      WHERE tu.user_id      = auth.uid()
        AND tu.tenant_id    = v_target_tenant_id
        AND tu.is_active    = true
        AND tu.tenant_role  = 'member'
        AND tu.operator_type = 'presidente'
    )
  ) THEN
    RAISE EXCEPTION 'Acesso negado: requer privilégios administrativos da unidade.';
  END IF;

  UPDATE public.financeiro_dae
  SET status           = 'cancelado',
      cancelado_em     = now(),
      cancelado_por    = auth.uid(),
      cancelamento_obs = 'Correção: Grupo re-emitido devido a edição de valores/competência'
  WHERE grupo_id = p_grupo_id AND status != 'cancelado';

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.financeiro_dae (
      socio_cpf, sessao_id, tipo_boleto, competencia_ano, competencia_mes,
      valor, forma_pagamento, boleto_pago, data_pagamento_boleto,
      status, registrado_por, data_recebimento, grupo_id
    ) VALUES (
      v_membro_base.socio_cpf, v_membro_base.sessao_id, v_membro_base.tipo_boleto,
      p_new_year, (v_item->>'mes')::int, (v_item->>'valor')::numeric,
      v_membro_base.forma_pagamento,
      COALESCE((SELECT boleto_pago FROM public.financeiro_dae
                WHERE grupo_id = p_grupo_id AND competencia_mes = (v_item->>'mes')::int LIMIT 1), false),
      (SELECT data_pagamento_boleto FROM public.financeiro_dae
       WHERE grupo_id = p_grupo_id AND competencia_mes = (v_item->>'mes')::int LIMIT 1),
      'pago', auth.uid(), v_membro_base.data_recebimento, v_novo_grupo_id
    );
  END LOOP;
END;
$function$;

-- 17. update_extension_license
CREATE OR REPLACE FUNCTION public.update_extension_license(p_key text, p_unit_id uuid DEFAULT NULL::uuid, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_tenant_id      uuid;
  v_target_unit_id uuid;
  v_unit_count     integer;
BEGIN
  v_tenant_id := public.get_caller_tenant_id(p_tenant_id);

  IF p_unit_id IS NOT NULL THEN
    v_target_unit_id := p_unit_id;
  ELSE
    SELECT count(*) INTO v_unit_count
    FROM public.configuracao_entidade
    WHERE tenant_id = v_tenant_id;

    IF v_unit_count = 0 THEN
      RAISE EXCEPTION 'Configuração da entidade não encontrada para o seu tenant.';
    END IF;

    IF v_unit_count <> 1 THEN
      RAISE EXCEPTION 'p_unit_id obrigatório: tabela configuracao_entidade está em modo multi-polo';
    END IF;

    SELECT unit_id INTO v_target_unit_id
    FROM public.configuracao_entidade
    WHERE tenant_id = v_tenant_id
    LIMIT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.configuracao_entidade c
    WHERE c.tenant_id = v_tenant_id
      AND c.unit_id   = v_target_unit_id
      AND (
        public.is_tenant_owner(v_tenant_id)
        OR EXISTS (
          SELECT 1 FROM public.user_unit_memberships m
          WHERE m.user_id   = auth.uid()
            AND m.tenant_id = v_tenant_id
            AND m.unit_id   = v_target_unit_id
            AND m.is_active = true
        )
      )
  ) THEN
    RAISE EXCEPTION 'Acesso negado: unit fora do seu escopo.';
  END IF;

  UPDATE public.configuracao_entidade
  SET extensao_license_key = NULLIF(btrim(p_key), ''),
      updated_at = now()
  WHERE tenant_id = v_tenant_id
    AND unit_id   = v_target_unit_id;
END;
$function$;

-- 18. update_member_regime
CREATE OR REPLACE FUNCTION public.update_member_regime(p_cpf text, p_novo_regime text, p_observacao text DEFAULT NULL::text, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id   uuid := auth.uid();
  v_tenant_id uuid;
BEGIN
  v_tenant_id := public.get_caller_tenant_id(p_tenant_id);

  IF NOT EXISTS (
    SELECT 1 FROM public.socios s
    WHERE s.cpf = p_cpf AND s.tenant_id = v_tenant_id
  ) THEN
    RAISE EXCEPTION 'access denied: CPF % does not belong to your tenant', p_cpf;
  END IF;

  UPDATE public.financeiro_historico_regime
  SET vigente_ate = CURRENT_DATE
  WHERE socio_cpf = p_cpf AND vigente_ate IS NULL;

  INSERT INTO public.financeiro_historico_regime
    (socio_cpf, regime, vigente_desde, alterado_por, observacao)
  VALUES (p_cpf, p_novo_regime, CURRENT_DATE, v_user_id, p_observacao);

  INSERT INTO public.financeiro_config_socio (cpf, regime)
  VALUES (p_cpf, p_novo_regime)
  ON CONFLICT (cpf) DO UPDATE SET regime = p_novo_regime, updated_at = now();
END;
$function$;
