-- Atualização da view de busca de requerimentos para incluir emissao_rgp
CREATE OR REPLACE VIEW public.v_requerimentos_busca AS
 SELECT r.id,
    r.cod_req,
    r.data_assinatura,
    r.cpf,
    r.ano_referencia,
    r.status_mte,
    r.data_envio,
    r.num_req_mte,
    r.created_at,
    r.updated_at,
    r.beneficio_recebido,
    s.nome AS socio_nome,
    s.nit AS socio_nit,
    s.emissao_rgp
   FROM requerimentos r
     LEFT JOIN socios s ON r.cpf = s.cpf;

-- RPC estendida para suportar filtros de "Não assinou" e "Possui carência" (3 estados)
-- DROP FUNCTION IF EXISTS public.list_requirements_extended(integer, text, text, text, boolean, integer, integer);
-- DROP FUNCTION IF EXISTS public.list_requirements_extended(integer, text, text, text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.list_requirements_extended(
  p_ano integer,
  p_status text DEFAULT 'all',
  p_beneficio text DEFAULT 'all',
  p_search text DEFAULT '',
  p_carencia text DEFAULT 'all', -- Mudado de boolean para text para suportar 3 estados
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  socio_id uuid,
  cod_req text,
  data_assinatura date,
  cpf text,
  ano_referencia integer,
  status_mte text,
  data_envio date,
  num_req_mte text,
  created_at timestamptz,
  updated_at timestamptz,
  beneficio_recebido boolean,
  socio_nome text,
  socio_nit text,
  socio_num_rgp text,
  socio_emissao_rgp date, -- Adicionado para exibição na tabela
  total_count bigint
) AS $$
DECLARE
  v_offset integer;
  v_defeso_start date;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  v_defeso_start := make_date(p_ano, 11, 15); -- Estimativa de início do defeso (15/Nov)
  
  RETURN QUERY
  WITH filtered_data AS (
    SELECT 
      r.id as requirement_id,
      s.id as member_id,
      r.cod_req,
      r.data_assinatura,
      s.cpf,
      COALESCE(r.ano_referencia, p_ano) as ano_referencia,
      COALESCE(r.status_mte, 'nao_assinado') as status_mte,
      r.data_envio,
      r.num_req_mte,
      r.created_at,
      r.updated_at,
      COALESCE(r.beneficio_recebido, false) as beneficio_recebido,
      s.nome as socio_nome,
      s.nit as socio_nit,
      s.num_rgp as socio_num_rgp,
      s.emissao_rgp as socio_emissao_rgp
    FROM socios s
    LEFT JOIN requerimentos r ON s.cpf = r.cpf AND r.ano_referencia = p_ano
    WHERE 
      -- Filtro de Status (incluindo o estado virtual 'nao_assinado')
      (p_status = 'all' OR (CASE WHEN p_status = 'nao_assinado' THEN r.id IS NULL ELSE r.status_mte = p_status END))
      
      -- Filtro de Benefício
      AND (p_beneficio = 'all' OR (CASE WHEN p_beneficio = 'recebido' THEN r.beneficio_recebido IS TRUE ELSE r.beneficio_recebido IS FALSE OR r.beneficio_recebido IS NULL END))
      
      -- Busca Global
      AND (p_search = '' OR (s.cpf ILIKE '%' || p_search || '%' OR s.nome ILIKE '%' || p_search || '%' OR r.cod_req ILIKE '%' || p_search || '%'))
      
      -- Filtro de Carência (all, com_carencia, sem_carencia)
      AND (
        CASE 
          WHEN p_carencia = 'com_carencia' THEN (s.emissao_rgp <= v_defeso_start - INTERVAL '1 year')
          WHEN p_carencia = 'sem_carencia' THEN (s.emissao_rgp > v_defeso_start - INTERVAL '1 year' OR s.emissao_rgp IS NULL)
          ELSE TRUE
        END
      )
  )
  SELECT 
    fd.requirement_id, fd.member_id, fd.cod_req, fd.data_assinatura, fd.cpf, fd.ano_referencia, 
    fd.status_mte, fd.data_envio, fd.num_req_mte, fd.created_at, fd.updated_at, 
    fd.beneficio_recebido, fd.socio_nome, fd.socio_nit, fd.socio_num_rgp, fd.socio_emissao_rgp,
    count(*) OVER() as total_count
  FROM filtered_data fd
  ORDER BY fd.created_at DESC NULLS LAST, fd.socio_nome ASC
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$ LANGUAGE plpgsql;
