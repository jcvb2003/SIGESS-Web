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
