/**
 * Detecta em qual modo a aplicação está operando:
 *
 * - Modo legado:      projetos antigos na Vercel — usam VITE_SUPABASE_URL genérico
 *                     sem as variáveis específicas por tenant (_Z2, _SINPESCA).
 *                     O tenant é identificado por VITE_LEGACY_TENANT_CODE.
 *
 * - Modo multi-tenant: app.sigess.com.br — usa variáveis por tenant.
 *                     O tenant é selecionado pelo código digitado no login.
 */

/** `true` quando o deploy é um projeto legado da Vercel (subdomínio exclusivo). */
export const isLegacyMode: boolean = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
    !import.meta.env.VITE_SUPABASE_URL_Z2 &&
    !import.meta.env.VITE_SUPABASE_URL_SINPESCA &&
    !import.meta.env.VITE_SUPABASE_URL_SINPESCA_BREVES,
);

/**
 * Código do tenant fixo nos projetos legados.
 * Defina em cada projeto antigo na Vercel:
 *   VITE_LEGACY_TENANT_CODE=z2        (entidade1-sigess.vercel.app)
 *   VITE_LEGACY_TENANT_CODE=sinpesca  (apop-sigess.vercel.app)
 */
export const LEGACY_TENANT_CODE: string =
  import.meta.env.VITE_LEGACY_TENANT_CODE ?? '';
