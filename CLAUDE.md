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

# Convenções de Arquitetura

## Escopo: queryKey deve refletir o scope da queryFn

Toda query que passa `unitId` para o service deve incluir `unitId` na `queryKey`.

```ts
// ✅ CORRETO — unitId no queryKey E no queryFn
queryKey: financeQueryKeys.dashboard({ ...params, _unitId: unitId }),
queryFn: () => financeService.getDashboard(params, unitId),
enabled: bootstrapped && !!unitId,

// ❌ PROIBIDO — unitId só no queryFn (cache não invalida ao trocar de polo)
queryKey: ['data'],
queryFn: () => financeService.getDashboard(params, unitId),
```

## Escopo: serviços de escrita exigem unitId não-nulo

Métodos que fazem INSERT, UPDATE ou DELETE em tabelas unidade-escopadas devem
receber `unitId: string | null` (não opcional) e lançar erro se null.

## Cores: sem hardcode de branding em src/modules/ e src/pages/

Componentes em `src/modules/` e `src/pages/` não introduzem:
- `bg-emerald-*`, `text-emerald-*`, `border-emerald-*` → usar `bg-primary` ou `bg-success`
- `bg-green-*`, `text-green-*` → idem
- `style={{ color: '...', backgroundColor: '...' }}` com valores literais de cor

Exceção: `src/shared/components/ui/` (shadcn — não alterar).

Regra de decisão para migração:
- Ação interativa (botão, hover, foco) → `primary`
- Estado de dado positivo (pago, ok) → `success`
- Estado de dado de atenção → `warning`
- Dado neutro → `foreground` ou deixar como está

## Domínio: onde vivem as regras de negócio

Regras puras (sem IO, sem supabase, sem UI) pertencem a `modules/[módulo]/domain/`.
Não exportar regras de domínio de arquivos de service, hook ou schema — se um componente
UI precisar importar de um service só para acessar uma função pura, mover a função
para `domain/` antes.

Arquivos em `domain/` (regras puras com nome explícito de domínio):
- `members/domain/memberCode.ts`, `memberErrors.ts`
- `reap/domain/reapDomain.ts`, `reapPendencias.ts`
- `finance/domain/paymentEligibility.ts`, `annuityRules.ts`

Arquivos em `utils/` (funções puras, candidatos futuros a `domain/` quando tiverem 3+ callers):
- `finance/utils/membershipCompetency.ts`, `defesoUtils.ts`, `paymentReportLabels.ts`
- `settings/utils/settingsHelpers.ts`

## Serviços: mapa pós-split de settingsService

`settingsService` não existe mais. Usar os especializados:
- identidade/branding → `entityService`
- parâmetros do sistema → `parametersService`
- localidades → `localitiesService` (não `memberService`)
- portarias → `portariasService`
- templates de documento → `documentTemplateService`
- troca de senha → `authService.changePassword`

## CI: cobertura atual

`Web/.github/workflows/web-ci.yml` executa `npx tsc --noEmit` e `npm test`
em push/PR para main. Todo novo serviço ou domain function deve ter teste
unitário que passe nesse pipeline.
