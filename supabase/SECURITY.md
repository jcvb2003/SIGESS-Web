# SIGESS Security & RLS Guide

Este documento detalha comportamentos críticos de segurança e Row-Level Security (RLS) no ecossistema SIGESS.

## Comportamento Silencioso do RLS

### Tabela `User` (Perfis de Usuário)

No PostgreSQL, quando o RLS está ativado, uma instrução `UPDATE` que não satisfaz a política `USING` ou `WITH CHECK` não resultará em um erro explícito (como Access Denied). Em vez disso:
- O PostgreSQL filtrará as linhas que o usuário não tem permissão para ver/editar.
- Se nenhuma linha satisfizer a política, o `UPDATE` será executado em zero linhas.
- O driver (supabase-js) retornará um sucesso com `data: []` (ou `null` para `.single()`).

**Implicação no SIGESS:**
Trabalhadores (workers) que tentarem atualizar perfis de outros usuários através da tabela `User` falharão silenciosamente. A UI deve verificar se a operação realmente afetou a linha esperada.

### Hardening de RPC Functions (`search_path`)

Todas as funções RPC (Edge Functions e Postgres Functions) devem declarar explicitamente o `search_path` como `public, pg_temp`. Isso evita ataques de sequestro de esquema (schema-hijacking) onde um usuário mal-intencionado cria tabelas/funções temporárias com nomes idênticos aos do sistema.

**Exemplo:**
```sql
CREATE OR REPLACE FUNCTION public.minha_funcao()
RETURNS void AS $$ ... $$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp; -- OBRIGATÓRIO
```

## Políticas de InitPlan

Para otimizar a performance, as políticas de RLS no SIGESS utilizam o padrão `(SELECT auth.uid())` em vez de apenas `auth.uid()`. Isso força o PostgreSQL a executar a função `auth.uid()` apenas uma vez por query (InitPlan) em vez de uma vez por linha, reduzindo drasticamente o overhead em tabelas grandes.
