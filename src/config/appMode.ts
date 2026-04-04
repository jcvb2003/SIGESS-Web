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
  'apop-sigess.vercel.app': 'sinpesca-breves',
};

// Se o domínio atual estiver no mapa, usamos o código dele
const detectedLegacyTenant = LEGACY_DOMAIN_MAP[hostname] || '';

/** Indica se estamos rodando localmente. */
export const isDev = hostname === 'localhost' || hostname === '127.0.0.1';

/** Código do tenant padrão para desenvolvimento local. */
export const DEV_DEFAULT_TENANT: string = import.meta.env.VITE_DEV_DEFAULT_TENANT || '';

/**
 * Código do tenant fixo nos projetos legados.
 */
export const LEGACY_TENANT_CODE: string = detectedLegacyTenant || '';

/**
 * `true` quando o deploy é identificado como um domínio legado pelo hostname.
 * No localhost, sempre retornamos `false` para permitir testar o fluxo multi-tenant.
 */
export const isLegacyMode: boolean = !isDev && Boolean(LEGACY_TENANT_CODE);
