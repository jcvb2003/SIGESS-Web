-- Migration: adicionar tenant_mode em entidade
-- Modalidade de produto por tenant: 'pesca' (default) | 'agricultura'
-- PostgreSQL preenche rows existentes com 'pesca' automaticamente.

ALTER TABLE public.entidade
  ADD COLUMN IF NOT EXISTS tenant_mode TEXT NOT NULL DEFAULT 'pesca'
  CHECK (tenant_mode IN ('pesca', 'agricultura'));
