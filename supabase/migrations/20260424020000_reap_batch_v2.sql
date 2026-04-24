-- [REAP] Batch Upsert RPCs v2 (SEC-5 Compliant)
-- Created: 2026-04-24

CREATE OR REPLACE FUNCTION public.reap_batch_upsert_simplificado_v2(p_entries jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entry jsonb;
  v_cpf text;
  v_simplificado jsonb;
  v_ano text;
  v_ano_data jsonb;
BEGIN
  FOR entry IN SELECT * FROM jsonb_array_elements(p_entries)
  LOOP
    v_cpf := entry->>'cpf';
    v_simplificado := entry->'simplificado';

    -- Garante que o registro base existe
    INSERT INTO public.reap (cpf, simplificado)
    VALUES (v_cpf, v_simplificado)
    ON CONFLICT (cpf) DO NOTHING;

    -- Faz o merge profundo por ano
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
$$;

CREATE OR REPLACE FUNCTION public.reap_batch_upsert_anual_v2(p_entries jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entry jsonb;
  v_cpf text;
  v_anual jsonb;
  v_ano text;
  v_ano_data jsonb;
BEGIN
  FOR entry IN SELECT * FROM jsonb_array_elements(p_entries)
  LOOP
    v_cpf := entry->>'cpf';
    v_anual := entry->'anual';

    -- Garante que o registro base existe
    INSERT INTO public.reap (cpf, anual)
    VALUES (v_cpf, v_anual)
    ON CONFLICT (cpf) DO NOTHING;

    -- Faz o merge profundo por ano
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
$$;
