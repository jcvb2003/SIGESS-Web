# SIGESS

Aplicação web (React + Vite + TypeScript) do **SIGESS**, com autenticação e dados via **Supabase**. Este README é voltado para **usuário final técnico do cliente** (instalação, configuração e implantação).

## Requisitos

- **Node.js**: 18+ (recomendado 20+)
- **NPM**: compatível com a versão do Node instalada

## Configuração (variáveis de ambiente)

Crie um arquivo `.env` na raiz do projeto com as variáveis abaixo:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
```

- **VITE_SUPABASE_URL**: URL do projeto no Supabase
- **VITE_SUPABASE_ANON_KEY**: chave pública (anon/publishable) do Supabase usada no frontend

## Executar em ambiente local (desenvolvimento)

Instalar dependências:

```bash
npm install
```

Iniciar servidor local:

```bash
npm run dev
```

Por padrão, o Vite disponibiliza o sistema em `http://localhost:5173`.

## Build para produção

Gerar build:

```bash
npm run build
```

Os arquivos finais serão gerados em `dist/`.

Testar o build localmente:

```bash
npm run preview
```

## Implantação (produção)

O SIGESS é entregue como **site estático**. Publique o conteúdo de `dist/` em um servidor web (ex.: Nginx/Apache/IIS) com suporte a **SPA fallback**:

- **Regra recomendada**: qualquer rota inexistente deve retornar `index.html` (para o roteamento do `react-router-dom` funcionar em refresh e links diretos).

## PWA / cache

O projeto utiliza PWA (via `vite-plugin-pwa`) com cache para chamadas do Supabase (REST) e objetos públicos do Storage. Em ambientes com proxy/CDN, valide:

- **Cache e headers**: não bloquear o service worker e permitir atualização automática.
- **Tamanho de assets**: existe limite de cache de 5 MB por arquivo para precache.

## Solução de problemas (rápido)

- **Tela em branco / erros no console ao abrir**: confirme se o `.env` existe e se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretos.
- **Erro ao acessar rota direto pela URL (404 no servidor)**: falta configurar o **SPA fallback** para `index.html` no servidor.
