# SIGESS

Aplicação web do **SIGESS**, desenvolvida com **React 19**, **Vite** e **TypeScript**, utilizando **Supabase** para backend e autenticação. Este README é voltado para desenvolvedores e usuários técnicos do cliente (instalação, configuração e arquitetura).

## 🚀 Tecnologias e Frameworks

O projeto utiliza um stack moderno focado em performance e produtividade:

- **Frontend Core**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/)
- **Estado e Dados**: [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **Formulários**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/) (validação)
- **Animações**: [Framer Motion](https://www.framer.com/motion/)
- **Utilidades**: 
  - [Date-fns](https://date-fns.org/) (manipulação de datas)
  - [Lucide React](https://lucide.dev/) (ícones)
  - [Sonner](https://sonner.stevenly.me/) (notificações)
  - [jspdf](https://rawgit.com/MrRio/jsPDF/master/docs/index.html) e [pdf-lib](https://pdf-lib.js.org/) (geração de PDFs)
  - [xlsx](https://sheetjs.com/) (exportação Excel)

---

## 🏗️ Arquitetura e Estrutura de Pastas

O projeto segue uma organização modularizada para facilitar a manutenção e evitar duplicidade de código:

### Diretório `src/`

- **`app/`**: Configurações globais e infraestrutura da aplicação.
  - `providers/`: Contextos e provedores (QueryClient, Auth, Theme, etc.).
  - `router/`: Definição de rotas da aplicação via `react-router-dom`.
  - `styles/`: Arquivos globais de CSS e configurações de tema.
- **`modules/`**: Contém a lógica de negócio encapsulada por domínio. Cada módulo geralmente possui hooks, tipos e serviços específicos.
  - `auth/`: Autenticação e gestão de sessão.
  - `dashboard/`: Lógica e dados dos painéis de indicadores.
  - `documents/`: Gestão e processamento de documentos.
  - `import/`: Lógica de importação de dados externos.
  - `members/`: Gestão de membros/colaboradores.
  - `reports/`: Geração de relatórios e exportações.
  - `settings/`: Configurações de sistema e perfil.
- **`pages/`**: Componentes de página que consomem os módulos. Organizadas seguindo a estrutura do menu da aplicação.
- **`shared/`**: Código reutilizável entre diferentes módulos e páginas.
  - `components/`: Componentes básicos de UI (botões, inputs, tabelas genéricas).
  - `hooks/`: Custom hooks de utilidade geral (ex: debouncing, local storage).
  - `lib/`: Configurações de bibliotecas externas (ex: supabase client).
  - `services/`: Serviços de API compartilhados.
  - `types/`: Definições de tipos e interfaces globais.
  - `utils/`: Funções auxiliares e formatadores.

---

## ⚙️ Configuração (Variáveis de Ambiente)

Crie um arquivo `.env` na raiz do projeto seguindo o modelo:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
```

- **VITE_SUPABASE_URL**: URL do projeto no Supabase
- **VITE_SUPABASE_ANON_KEY**: chave pública (anon) do Supabase frontend

---

## 🛠️ Executar em Ambiente Local

1. Instalar dependências:
   ```bash
   npm install
   ```
2. Iniciar servidor local:
   ```bash
   npm run dev
   ```
   Acesse: `http://localhost:5173`.

## 📦 Build e Produção

1. Gerar build:
   ```bash
   npm run build
   ```
   Os arquivos finais serão gerados em `dist/`.

2. **Implantação**: O projeto é um SPA estático. Configure o servidor web (Nginx/Apache) para **SPA fallback** (rotas inexistentes devem retornar `index.html`).

## 📱 PWA e Cache

O projeto utiliza `vite-plugin-pwa` para suporte offline e cache de assets. Para garantir o funcionamento correto:
- Não bloqueie o service worker em proxies/CDNs.
- Respeite o limite de 20 MB para precache de arquivos.

---

## 📝 Regras de Codificação (User Rules)

Este projeto segue diretrizes estritas para manter a qualidade do código:
1. **DRY**: Evitar duplicação de lógica, extraindo para `shared/`.
2. **TypeScript**: Uso rigoroso de tipos; evitar `any`.
3. **Componentização**: Componentes focados e com responsabilidade única.
4. **Separation of Concerns**: Lógica de dados nos `modules/` e UI nas `pages/` ou `shared/components/`.
