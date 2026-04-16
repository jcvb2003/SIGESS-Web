-- Migration: Adicionar coluna de observações à tabela reap
-- Data: 2026-04-15

ALTER TABLE public.reap ADD COLUMN IF NOT EXISTS observacoes text;
