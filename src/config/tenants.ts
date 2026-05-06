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

// ─── Dynamic Config Resolver ─────────────────────────────────────────────────

export const TENANT_CONFIG_CACHE_KEY = 'sigess_tenant_config';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface CachedTenantConfig extends TenantConfig {
  code: string;
  cachedAt: number;
  source: 'env' | 'remote' | 'stale';
}

function readConfigCache(code: string): CachedTenantConfig | null {
  try {
    const raw = typeof globalThis !== 'undefined' ? globalThis.localStorage?.getItem(TENANT_CONFIG_CACHE_KEY) : null;
    if (!raw) return null;
    const cached: CachedTenantConfig = JSON.parse(raw);
    return cached.code === code ? cached : null;
  } catch {
    return null;
  }
}

function writeConfigCache(code: string, config: TenantConfig, source: 'env' | 'remote'): void {
  try {
    const entry: CachedTenantConfig = { ...config, code, cachedAt: Date.now(), source };
    typeof globalThis !== 'undefined' && globalThis.localStorage?.setItem(TENANT_CONFIG_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage pode falhar em modo privado
  }
}

/**
 * Resolve a configuração de um tenant de forma assíncrona.
 * Ordem: env vars (build-time) → cache localStorage (24h) → Edge Function tenant-config → cache stale.
 * Lança erro se o tenant não for encontrado em nenhuma fonte.
 */
export async function resolveAndCacheTenant(code: string): Promise<TenantConfig> {
  const normalized = code.toLowerCase().trim();

  // 1. Env map (tenants existentes buildados no Vercel)
  const fromEnv = resolveTenant(normalized);
  if (fromEnv) {
    writeConfigCache(normalized, fromEnv, 'env');
    return fromEnv;
  }

  // 2. Cache localStorage válido
  const cached = readConfigCache(normalized);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { label: cached.label, supabaseUrl: cached.supabaseUrl, supabaseAnonKey: cached.supabaseAnonKey };
  }

  // 3. Remote fetch via Edge Function
  const env = (import.meta as unknown as { env: EnvSource }).env;
  const configUrl = env?.VITE_ADMIN_TENANT_CONFIG_URL;

  if (!configUrl) {
    // Sem URL configurada: usar cache stale se disponível
    if (cached) return { label: cached.label, supabaseUrl: cached.supabaseUrl, supabaseAnonKey: cached.supabaseAnonKey };
    throw new Error(`Entidade "${normalized}" não encontrada`);
  }

  try {
    const res = await fetch(`${configUrl}?code=${encodeURIComponent(normalized)}`);
    if (res.status === 404) throw new Error(`Entidade "${normalized}" não encontrada`);
    if (!res.ok) throw new Error('Configuração da entidade indisponível');

    const data = await res.json() as { label: string; supabaseUrl: string; anonKey: string };
    const config: TenantConfig = { label: data.label, supabaseUrl: data.supabaseUrl, supabaseAnonKey: data.anonKey };
    writeConfigCache(normalized, config, 'remote');
    return config;
  } catch (err) {
    // Fallback para cache stale se fetch falhou
    if (cached) {
      try {
        typeof globalThis !== 'undefined' && globalThis.localStorage?.setItem(
          TENANT_CONFIG_CACHE_KEY,
          JSON.stringify({ ...cached, source: 'stale' })
        );
      } catch { /* ignorar */ }
      return { label: cached.label, supabaseUrl: cached.supabaseUrl, supabaseAnonKey: cached.supabaseAnonKey };
    }
    throw err;
  }
}
