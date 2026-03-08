-- Migration: v_requerimentos_busca
-- Description: View estendida para busca global em requerimentos e sócios
-- Author: Antigravity
-- Date: 2026-04-11

CREATE OR REPLACE VIEW public.v_requerimentos_busca 
WITH (security_invoker = true) AS
SELECT 
  r.*,
  s.nome AS socio_nome,
  s.nit AS socio_nit
FROM public.requerimentos r
LEFT JOIN public.socios s ON r.cpf = s.cpf;
