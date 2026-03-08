# Guia de Migrations — SIGESS

## Regra de Ouro

**Toda mudança de banco vira um arquivo `.sql` em `supabase/migrations/`.**  
Nada de SQL manual no painel, nada de correção pontual via `client-proxy`.  
O `--sync` é o único deploy de banco.

---

## Convenções

### Nome do arquivo
```
YYYYMMDD_descricao_em_snake_case.sql
```
Exemplos:
- `20260410_requerimentos_defeso.sql`
- `20260411_evolution_requerimentos_full.sql`

A ordem cronológica do prefixo **garante a ordem de aplicação**. Nunca reutilize datas — se precisar de duas migrations no mesmo dia, use sufixo `_v2`, `_v3`.

### Idempotência obrigatória

Toda migration deve poder ser rodada mais de uma vez sem erro. Use sempre:

```sql
-- Colunas
ALTER TABLE t ADD COLUMN IF NOT EXISTS col text;

-- Tabelas
CREATE TABLE IF NOT EXISTS public.tabela (...);

-- Views (sempre idempotente)
CREATE OR REPLACE VIEW public.v_nome AS ...;

-- Constraints (não têm IF NOT EXISTS — use bloco DO)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'nome_da_constraint'
  ) THEN
    ALTER TABLE public.t ADD CONSTRAINT nome_da_constraint ...;
  END IF;
END $$;

-- Renomear coluna (só se ainda não foi renomeada)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 't' AND column_name = 'nome_antigo'
  ) THEN
    ALTER TABLE public.t RENAME COLUMN nome_antigo TO nome_novo;
  END IF;
END $$;

-- Dropar constraint (sem erro se não existir)
ALTER TABLE public.t DROP CONSTRAINT IF EXISTS nome_da_constraint;
```

### Segurança em funções e views

Toda função `SECURITY DEFINER` deve ter:
```sql
SET search_path TO 'public', 'pg_temp';
```

Toda view deve ser criada com:
```sql
CREATE OR REPLACE VIEW public.v_nome
WITH (security_invoker = true) AS ...;
```

---

## Workflow de Deploy

```bash
# 1. Criar o arquivo de migration
# supabase/migrations/YYYYMMDD_descricao.sql

# 2. Simular antes de aplicar
npx tsx scripts/migrate-tenants.ts --sync --dry-run

# 3. Aplicar em todos os tenants
npx tsx scripts/migrate-tenants.ts --sync

# 4. Verificar paridade entre bancos
npx tsx scripts/migrate-tenants.ts --list-applied

# 5. Aplicar em um tenant específico (ex: só Oeiras para testar)
npx tsx scripts/migrate-tenants.ts --sync --tenant=oeiras
```

---

## Tenant de Staging

**SINPESCA OEIRAS** é o canário — sempre validar lá antes de propagar para Z2 e Breves.

```bash
npx tsx scripts/migrate-tenants.ts --sync --tenant=oeiras
# validar...
npx tsx scripts/migrate-tenants.ts --sync
```

---

## Rastreamento

Cada tenant tem uma tabela `public._migrations` que registra o que foi aplicado:

```sql
SELECT * FROM public._migrations ORDER BY applied_at;
```

O runner compara os arquivos em `supabase/migrations/` com os registros nessa tabela e aplica apenas o que está pendente, em ordem.

---

## Armadilhas Conhecidas

| Situação | Problema | Solução |
|---|---|---|
| Usar `VITE_` como prefixo de senha | Expõe no bundle | Usar `DB_PASSWORD_[CÓDIGO]` |
| Porta 6543 (PgBouncer) para DDL | Sessão inconsistente | Usar porta 5432 |
| Bancos IPv6-only | `ENOTFOUND` no Node | Usar pooler `aws-0-sa-east-1.pooler.supabase.com` |
| Migration sem idempotência | Falha em banco já atualizado | Sempre usar `IF NOT EXISTS` e `DO $$` |
| Dropar coluna sem verificar FKs | Erro de constraint | Verificar `information_schema.referential_constraints` antes |
| `status` como enum sem `pago` | Motor de importação falha | `beneficio_recebido boolean` é o fato financeiro, não status de processo |

---

## Convenção de Prefixos de Tabelas

- `admin_` — tabelas exclusivas do painel admin, nunca replicadas para tenants clientes
- `financeiro_` — módulo financeiro
- `v_` — views
- `_migrations` — controle interno do runner (não tocar)

---

## Estrutura Atual dos Tenants

| Tenant | Project Ref | Região |
|---|---|---|
| SINPESCA OEIRAS (staging) | `tnrzxuznerneilxoojgv` | sa-east-1 |
| COLÔNIA Z2 SALVATERRA | `jatnbqspfvhvlzaoekzz` | sa-east-1 |
| SINPESCA BREVES | `typimbftfeiqdzrwtake` | us-west-2 |
