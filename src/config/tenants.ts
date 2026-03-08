export interface TenantConfig {
  label: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

type EnvSource = Record<string, string | undefined>;

/**
 * Constrói o mapa de tenants dinamicamente a partir das variáveis de ambiente
 * injetadas no Vercel ou no Node.js, seguindo a convenção:
 *
 *   VITE_SUPABASE_URL_[CÓDIGO]      → URL do projeto Supabase
 *   VITE_SUPABASE_ANON_KEY_[CÓDIGO] → Chave pública (obrigatória)
 *   VITE_SUPABASE_LABEL_[CÓDIGO]    → Label amigável (opcional)
 *
 * @param env Injetor de variáveis (default: import.meta.env para Vite)
 */
export function buildTenants(env: EnvSource = (import.meta as unknown as { env: EnvSource }).env): Record<string, TenantConfig> {
  const tenants: Record<string, TenantConfig> = {};
  const envEntries = Object.entries(env || {});

  envEntries.forEach(([key, value]) => {
    const match = key.match(/^VITE_SUPABASE_URL_(.+)$/);
    if (!match) return;

    const envCode = match[1]; // ex: Z2, SINPESCA_BREVES
    const code = envCode.toLowerCase().replace(/_/g, '-'); // ex: z2, sinpesca-breves
    const anonKey = env[`VITE_SUPABASE_ANON_KEY_${envCode}`] as string | undefined;

    // Ignora entradas sem chave correspondente
    if (!anonKey) return;

    const label =
      (env[`VITE_SUPABASE_LABEL_${envCode}`] as string | undefined) ??
      envCode.replace(/_/g, ' '); // fallback: "SINPESCA BREVES"

    tenants[code] = {
      label,
      supabaseUrl: value as string,
      supabaseAnonKey: anonKey,
    };
  });

  return tenants;
}

export const TENANTS = buildTenants();

export function resolveTenant(code: string): TenantConfig | null {
  if (!code) return null;
  return TENANTS[code.toLowerCase().trim()] ?? null;
}

export function resolveTenantBySupabaseUrl(url: string | undefined): string | null {
  if (!url) return null;
  const match = Object.entries(TENANTS).find(([, config]) =>
    url.startsWith(config.supabaseUrl)
  );
  return match ? match[0] : null;
}
