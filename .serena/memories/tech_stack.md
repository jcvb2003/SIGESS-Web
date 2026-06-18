# Tech Stack

- **React 19**, **TypeScript** (strict mode), **Vite**
- **React Router v7** for routing
- **TanStack Query v5** (`useQuery`, `useMutation`) for all data fetching
- **Supabase** JS client (`@supabase/supabase-js`) — multi-tenant: env vars `VITE_SUPABASE_URL_[CODE]` / `VITE_SUPABASE_ANON_KEY_[CODE]`
- **Shadcn UI** (Radix UI primitives) + **Tailwind CSS v3** (dark mode via `class`)
- **React Hook Form** + **Zod** for forms
- **Sonner** for toasts
- **PWA** via `vite-plugin-pwa` (service worker, offline support)
- **No test runner configured** — zero test files exist (as of 2026-06-17)
- Package manager: **npm**
- Build: `tsc -b && vite build`
- Lint: ESLint
