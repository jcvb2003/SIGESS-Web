# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Reversa

> Framework de Engenharia Reversa instalado neste projeto.

## Como usar

Digite `/reversa` para ativar o Reversa e iniciar ou retomar a análise do projeto.

## Comportamento ao ativar

Quando o usuário digitar `/reversa` ou a palavra `reversa` sozinha em uma mensagem:

1. Ative o skill `reversa` disponível em `.claude/skills/reversa/SKILL.md`
2. Se não encontrar em `.claude/skills/`, tente `.agents/skills/reversa/SKILL.md`
3. Leia o SKILL.md na íntegra e siga exatamente as instruções do Reversa

## Regra não-negociável

Nunca apague, modifique ou sobrescreva arquivos pré-existentes do projeto legado.
O Reversa escreve **apenas** em `.reversa/` e `_reversa_sdd/`.

---

## Comandos

```bash
npm run dev          # Dev server
npm run build        # tsc -b && vite build
npm run lint         # ESLint
npm test             # Vitest (todos os testes)
npx vitest run src/modules/finance/services/__tests__/financeService.test.ts  # teste único
npx tsc --noEmit     # Verificação de tipos (também executada no CI)
```

CI (`web-ci.yml`): executa `npx tsc --noEmit` e `npm test` em push/PR para main. Todo novo serviço ou domain function deve ter teste unitário que passe nesse pipeline.

---

## Arquitetura de Tenant

### Topologias

O sistema suporta múltiplas topologias definidas em `src/config/tenants.ts`:
- `isolated_single` / `isolated_polo` — Supabase dedicado por tenant
- `shared_multi_single` / `shared_multi_polo` / `shared_hybrid` — Supabase compartilhado com `tenant_id` em cada tabela
- `unconfigured` — estado de bootstrapping

A topologia ativa é lida do localStorage (`sigess_tenant_config`) e determina como o cliente Supabase filtra dados. Use `isSharedTopology(topology)` e `hasPoloTopology(topology)` de `src/config/tenants.ts`.

### Hierarquia de escopo: tenant → polo → unidade

```
Tenant (Supabase project)
  └── Polo (agrupamento opcional, topology *_polo)
        └── Unit (polo/sede individual)
```

O escopo ativo é exposto por `useActiveScope()` (`src/shared/hooks/useActiveScope.ts`):

```ts
const { unitId, tenantId, bootstrapped } = useActiveScope();
```

- `unitId: string | null` — null quando o usuário está na sede/raiz sem polo selecionado
- `bootstrapped: boolean` — true após o `TenantUnitBootstrapper` concluir o bootstrap de polos

**Toda query de dados deve ser gateada assim:**

```ts
enabled: bootstrapped && !!unitId,
```

Sem `bootstrapped`, a query pode disparar com `unitId = null` antes de o bootstrap concluir.

### TenantUnitContext

`src/modules/tenant-units/context/TenantUnitContext.tsx` — fonte de verdade para unidade ativa. Persiste em localStorage com chave escopada por tenant code (ex: `sigess_active_unit_coop1`). O `TenantUnitBootstrapper` popula as unidades disponíveis após login.

---

## Padrões de Código

### QueryKeys por módulo

Cada módulo tem `src/modules/[módulo]/queryKeys.ts`. Use sempre as factory functions; nunca escreva arrays literais de queryKey inline. O `unitId` deve estar na queryKey de toda query que o recebe na queryFn:

```ts
// ✅ CORRETO — unitId no queryKey E no queryFn
queryKey: financeQueryKeys.dashboard({ ...params, _unitId: unitId }),
queryFn: () => financeService.getDashboard(params, unitId),
enabled: bootstrapped && !!unitId,

// ❌ PROIBIDO — unitId só no queryFn (cache não invalida ao trocar de polo)
queryKey: ['data'],
queryFn: () => financeService.getDashboard(params, unitId),
```

### Serviços de escrita exigem unitId não-nulo

Métodos que fazem INSERT, UPDATE ou DELETE em tabelas unidade-escopadas devem receber `unitId: string | null` (não opcional) e lançar erro se null.

### Supabase client

```ts
import { supabase } from "@/shared/lib/supabase/client";
```

Único ponto de importação do cliente Supabase. Não instanciar diretamente.

### Mapa de serviços (pós-split de settingsService)

`settingsService` não existe mais. Usar os especializados:
- identidade/branding → `entityService`
- parâmetros do sistema → `parametersService`
- localidades → `localitiesService` (não `memberService`)
- portarias → `portariasService`
- templates de documento → `documentTemplateService`
- troca de senha → `authService.changePassword`

### Gating de módulos por modalidade

```ts
const mode = useTenantMode(); // 'pesca' | 'agricultura'
```

`useTenantMode()` (`src/shared/hooks/useTenantMode.ts`) — usar apenas para habilitar/desabilitar seções, nunca para branding visual. Fallback resiliente: ausência de configuração → `'pesca'`.

---

## Domínio: onde vivem as regras de negócio

Regras puras (sem IO, sem supabase, sem UI) pertencem a `modules/[módulo]/domain/`. Não exportar regras de domínio de arquivos de service, hook ou schema.

Arquivos em `domain/` (regras puras com nome explícito de domínio):
- `members/domain/memberCode.ts`, `memberErrors.ts`
- `reap/domain/reapDomain.ts`, `reapPendencias.ts`
- `finance/domain/paymentEligibility.ts`, `annuityRules.ts`

Arquivos em `utils/` (funções puras, candidatos futuros a `domain/` quando tiverem 3+ callers):
- `finance/utils/membershipCompetency.ts`, `defesoUtils.ts`, `paymentReportLabels.ts`
- `settings/utils/settingsHelpers.ts`

---

## Componentes de Formulário

`src/shared/components/form-fields/fields/` — biblioteca de campos reutilizáveis (TextField, SelectField, DateField, CpfField, etc.). Todos consomem `control` e `name` do React Hook Form via `FormField`/`Controller`.

**`useFieldBackgroundColors`** — hook que aplica cor de fundo verde (preenchido) ou azul-claro (vazio) automaticamente em campos de formulário, lendo via `watch(fieldName)` do `useFormContext`.

**SelectField**: usa `useWatch({ control, name })` para o valor exibido (independente do timing do `Controller`), e `value={watchedValue || undefined}` no `<Select>` para evitar conflito controlled/uncontrolled do Radix quando o valor é string vazia.

---

## Cores: sem hardcode de branding em src/modules/ e src/pages/

Componentes em `src/modules/` e `src/pages/` não introduzem:
- `bg-emerald-*`, `text-emerald-*`, `border-emerald-*` → usar `bg-primary` ou `bg-success`
- `bg-green-*`, `text-green-*` → idem
- `style={{ color: '...', backgroundColor: '...' }}` com valores literais de cor

Exceção: `src/shared/components/ui/` (shadcn — não alterar).

Regra de decisão:
- Ação interativa (botão, hover, foco) → `primary`
- Estado de dado positivo (pago, ok) → `success`
- Estado de dado de atenção → `warning`
- Dado neutro → `foreground`

---

## Testes

Convenção de mock do Supabase:

```ts
vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}));

import { buildQueryMock } from '@/test/mocks/supabaseMock';
```

Testes vivem em `__tests__/` dentro da pasta do arquivo testado (`services/__tests__/`, `domain/__tests__/`).
