CREATE TABLE IF NOT EXISTS public.reap (
    cpf text NOT NULL,
    simplificado jsonb NOT NULL DEFAULT '{}'::jsonb,
    anual jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT reap_pkey PRIMARY KEY (cpf)
);

-- Força a Foreign Key logic para RESTRICT sobre bancos que possivelmente nasceram com CASCADE manual
ALTER TABLE public.reap DROP CONSTRAINT IF EXISTS reap_cpf_fkey;
ALTER TABLE public.reap ADD CONSTRAINT reap_cpf_fkey FOREIGN KEY (cpf) 
        REFERENCES public.socios(cpf) ON DELETE RESTRICT;

ALTER TABLE public.reap ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.reap;
CREATE POLICY "Allow all for authenticated users" ON public.reap
    FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.reap_upsert_simplificado_ano(p_cpf text, p_ano text, p_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
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

CREATE OR REPLACE FUNCTION public.reap_upsert_anual_ano(p_cpf text, p_ano text, p_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
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
