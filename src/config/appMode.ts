/**
 * Detecta em qual modo a aplicação está operando:
 *
 * - Modo legado:      projetos antigos na Vercel (hostname mapeado)
 *                     O tenant é resolvido automaticamente pelo domínio.
 *
 * - Modo multi-tenant: app.sigess.com.br — usa variáveis por tenant.
 *                     O tenant é selecionado pelo código digitado no login.
 */

// Hostname em runtime (no navegador)
const hostname = typeof globalThis !== 'undefined' && globalThis.location
  ? globalThis.location.hostname
  : '';

/** Mapeamento de domínios legados para seus respectivos códigos de tenant. */
const LEGACY_DOMAIN_MAP: Record<string, string> = {
  'entidade1-sigess.vercel.app': 'z2',
  'apop-sigess.vercel.app': 'sinpesca',
};

// Se o domínio atual estiver no mapa, usamos o código dele
const detectedLegacyTenant = LEGACY_DOMAIN_MAP[hostname] || '';

/**
 * Código do tenant fixo nos projetos legados.
 */
export const LEGACY_TENANT_CODE: string =
  detectedLegacyTenant || import.meta.env.VITE_LEGACY_TENANT_CODE || '';

/**
 * `true` quando o deploy é identificado como um domínio legado pelo hostname.
 */
export const isLegacyMode: boolean = Boolean(LEGACY_TENANT_CODE);
