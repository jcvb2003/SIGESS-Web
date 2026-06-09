# SIGESS

Aplicacao web do **SIGESS**, desenvolvida com **React 19**, **Vite** e
**TypeScript**, utilizando **Supabase** para backend e autenticacao. Este
README e voltado para desenvolvedores e usuarios tecnicos do cliente
(instalacao, configuracao e arquitetura).

## Tecnologias e Frameworks

O projeto utiliza um stack moderno focado em performance e produtividade:

- **Frontend Core**: [React 19](https://react.dev/),
  [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Auth,
  Storage)
- **Estilizacao**: [Tailwind CSS](https://tailwindcss.com/),
  [Shadcn UI](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/)
- **Estado e Dados**: [TanStack Query](https://tanstack.com/query/latest)
  (React Query)
- **Formularios**: [React Hook Form](https://react-hook-form.com/),
  [Zod](https://zod.dev/) (validacao)
- **Animacoes**: [Framer Motion](https://www.framer.com/motion/)
- **Utilidades**:
  - [Date-fns](https://date-fns.org/) (manipulacao de datas)
  - [Lucide React](https://lucide.dev/) (icones)
  - [Sonner](https://sonner.stevenly.me/) (notificacoes)
  - [jspdf](https://rawgit.com/MrRio/jsPDF/master/docs/index.html) e
    [pdf-lib](https://pdf-lib.js.org/) (geracao de PDFs)
  - [xlsx](https://sheetjs.com/) (exportacao Excel)

---

## Arquitetura Operacional do SIGESS

Esta secao precisa permanecer visivel porque varias decisoes de RLS, RPC,
`manage-user`, administracao e filtros do Web dependem dela.

### 1. `tenant_id` e `unit_id` sao fronteiras diferentes

- `tenant_id` e a fronteira de isolamento entre entidades.
- `unit_id` e a fronteira operacional dentro de uma entidade, usada para polos.
- Polo nao e tenant.
- Tenant nao e projeto.
- Usuario nao cruza tenants.

Regra pratica:

- Em topologias `shared`, `tenant_id` e obrigatorio para impedir vazamento
  entre entidades.
- Em topologias com polos, `unit_id` define o escopo operacional dentro do
  mesmo tenant.
- `unit_id` nunca substitui `tenant_id`; ele so faz sentido depois que o tenant
  certo ja foi garantido.
- `unitIds = []` nao prova escopo tenant-wide; tambem pode significar dado
  incompleto ou membership ausente.

### 2. As 5 topologias canonicas

O Web deve ser pensado para funcionar nestas 5 topologias, mesmo quando o
runtime exposto em `deploymentMode` estiver resumido em `isolated` ou
`shared`.

| Topologia | Tenants no DB | Polos | Leitura rapida |
| --- | :---: | :---: | --- |
| `isolated_single` | 1 | 0 | um tenant, sem polos |
| `isolated_polo` | 1 | N | um tenant, com polos |
| `shared_multi_single` | N | 0 | varios tenants, sem polos |
| `shared_multi_polo` | N | N por tenant | varios tenants, cada um com polos |
| `shared_hybrid` | N | misto | mistura tenants com e sem polos |

Regras de leitura:

- `shared` sem polos = `shared_multi_single`
- `shared` com polos = `shared_multi_polo`
- nao confundir `isolated_polo` com `shared_multi_polo`

### 3. Papel tecnico nao e papel de negocio

No modelo atual, as duas dimensoes convivem:

- `tenant_role` = vinculo tecnico/estrutural com o tenant
- `operator_type` = papel operacional no negocio

Hierarquia canonica:

- `owner`
- `presidente`
- `auxiliar`

Regras importantes:

- `owner` e `presidente` nao sao sinonimos.
- `administrador` nao e um papel separado neste modelo.
- `owner` representa governanca estrutural do tenant.
- `presidente` representa o papel operacional principal.
- `auxiliar` atua abaixo do presidente.

Escopo por topologia:

- Sem polos (`isolated_single`, `shared_multi_single`): `presidente` enxerga e
  gerencia o tenant inteiro.
- Com polos (`isolated_polo`, `shared_multi_polo`, `shared_hybrid`):
  `presidente` enxerga e gerencia apenas o proprio polo.
- Em cenarios com polos, `presidente` nao herda visibilidade de `owner` sem
  membership explicito.

### 4. Guarda arquitetural para proxy em projetos shared

O Admin emite `Operacoes proxy nao sao permitidas em projetos shared` como
guarda arquitetural deliberada.

Por que isso existe:

- Funcoes com `SECURITY DEFINER` bypassam RLS completamente.
- Se a funcao nao recebe `tenant_id` como parametro, nem o deriva de forma
  segura por `unit_id`, ela pode atravessar todos os tenants do banco.
- Em projeto shared com N tenants, chamar a funcao com `p_unit_id = NULL` pode
  vazar dados de outras entidades.

Regra de aplicacao:

- Nunca propagar via proxy funcoes `SECURITY DEFINER` sem filtro de tenant para
  projetos shared.
- Nesses casos, aplicar direto via MCP ou Management API, sempre com revisao
  manual.
- `get_payments_by_period_paginated` e segura em `isolated_single` e em shared
  de tenant unico, porque `unit_id` ja isola implicitamente nesses cenarios.
- O risco real aparece em shared com N tenants quando `p_unit_id = NULL`.
- Para tornar uma funcao universalmente segura em N tenants com
  `SECURITY DEFINER`, garantir que o caller sempre passe `p_unit_id` ou
  adicionar derivacao segura de tenant via `tenant_units`.

---

## Arquitetura e Estrutura de Pastas

O projeto segue uma organizacao modularizada para facilitar a manutencao e
evitar duplicidade de codigo:

### Diretorio `src/`

- **`app/`**: Configuracoes globais e infraestrutura da aplicacao.
  - `providers/`: Contextos e provedores (QueryClient, Auth, Theme, etc.).
  - `router/`: Definicao de rotas da aplicacao via `react-router-dom`.
  - `styles/`: Arquivos globais de CSS e configuracoes de tema.
- **`modules/`**: Contem a logica de negocio encapsulada por dominio. Cada
  modulo geralmente possui hooks, tipos e servicos especificos.
  - `auth/`: Autenticacao e gestao de sessao.
  - `dashboard/`: Logica e dados dos paineis de indicadores.
  - `documents/`: Gestao e processamento de documentos.
  - `import/`: Logica de importacao de dados externos.
  - `members/`: Gestao de membros/colaboradores.
  - `reports/`: Geracao de relatorios e exportacoes.
  - `settings/`: Configuracoes de sistema e perfil.
- **`pages/`**: Componentes de pagina que consomem os modulos. Organizadas
  seguindo a estrutura do menu da aplicacao.
- **`shared/`**: Codigo reutilizavel entre diferentes modulos e paginas.
  - `components/`: Componentes basicos de UI (botoes, inputs, tabelas
    genericas).
  - `hooks/`: Custom hooks de utilidade geral (ex: debouncing, local storage).
  - `lib/`: Configuracoes de bibliotecas externas (ex: supabase client).
  - `services/`: Servicos de API compartilhados.
  - `types/`: Definicoes de tipos e interfaces globais.
  - `utils/`: Funcoes auxiliares e formatadores.

---

## Configuracao (Variaveis de Ambiente)

Crie um arquivo `.env` na raiz do projeto seguindo o modelo:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
```

- **VITE_SUPABASE_URL**: URL do projeto no Supabase
- **VITE_SUPABASE_ANON_KEY**: chave publica (anon) do Supabase frontend

---

## Executar em Ambiente Local

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar servidor local:
   ```bash
   npm run dev
   ```
   Acesse: `http://localhost:5173`.

## Build e Producao

1. Gerar build:
   ```bash
   npm run build
   ```
   Os arquivos finais serao gerados em `dist/`.

2. **Implantacao**: O projeto e um SPA estatico. Configure o servidor web
   (Nginx/Apache) para **SPA fallback** (rotas inexistentes devem retornar
   `index.html`).

## PWA e Cache

O projeto utiliza `vite-plugin-pwa` para suporte offline e cache de assets.
Para garantir o funcionamento correto:

- Nao bloqueie o service worker em proxies/CDNs.
- Respeite o limite de 20 MB para precache de arquivos.

---

## Regras de Codificacao

Este projeto segue diretrizes estritas para manter a qualidade do codigo:

1. **DRY**: Evitar duplicacao de logica, extraindo para `shared/`.
2. **TypeScript**: Uso rigoroso de tipos; evitar `any`.
3. **Componentizacao**: Componentes focados e com responsabilidade unica.
4. **Separation of Concerns**: Logica de dados nos `modules/` e UI nas
   `pages/` ou `shared/components/`.
