export interface TenantConfig {
  label: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  deploymentMode: "isolated" | "shared";
  hasPolos: boolean;
}

type EnvSource = {
  VITE_ADMIN_TENANT_CONFIG_URL?: string;
};

export const TENANT_CONFIG_CACHE_KEY = "sigess_tenant_config";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface CachedTenantConfig extends TenantConfig {
  code: string;
  cachedAt: number;
  source: "remote" | "stale";
}

export function normalizeTenantCode(code: string): string {
  return code.toLowerCase().trim();
}

function readConfigCacheEntry(code?: string): CachedTenantConfig | null {
  try {
    const raw =
      typeof globalThis !== "undefined"
        ? globalThis.localStorage?.getItem(TENANT_CONFIG_CACHE_KEY)
        : null;
    if (!raw) return null;

    const cached: CachedTenantConfig = JSON.parse(raw);
    if (code && cached.code !== normalizeTenantCode(code)) return null;
    return cached;
  } catch {
    return null;
  }
}

export function getCachedTenantConfig(code?: string): TenantConfig | null {
  const cached = readConfigCacheEntry(code);
  if (!cached) return null;
  if (cached.deploymentMode !== "isolated" && cached.deploymentMode !== "shared") return null;

  return {
    label: cached.label,
    supabaseUrl: cached.supabaseUrl,
    supabaseAnonKey: cached.supabaseAnonKey,
    deploymentMode: cached.deploymentMode,
    hasPolos: cached.hasPolos ?? false,
  };
}

export function getCurrentTenantConfig(): TenantConfig | null {
  return getCachedTenantConfig();
}

export function clearTenantConfigCache(): void {
  if (typeof globalThis !== "undefined") {
    globalThis.localStorage?.removeItem(TENANT_CONFIG_CACHE_KEY);
  }
}

function writeConfigCache(code: string, config: TenantConfig, source: "remote" | "stale"): void {
  try {
    const entry: CachedTenantConfig = {
      ...config,
      code,
      cachedAt: Date.now(),
      source,
    };
    if (typeof globalThis !== "undefined") {
      globalThis.localStorage?.setItem(TENANT_CONFIG_CACHE_KEY, JSON.stringify(entry));
    }
  } catch {
    // localStorage pode falhar em modo privado
  }
}

/**
 * Resolve a configuração de um tenant de forma assíncrona.
 * Ordem: cache localStorage válido (24h) -> Edge Function tenant-config -> cache stale.
 * Lança erro se o tenant não for encontrado em nenhuma fonte.
 */
export async function resolveAndCacheTenant(code: string): Promise<TenantConfig> {
  const normalized = normalizeTenantCode(code);

  const cached = readConfigCacheEntry(normalized);
  if (
    cached &&
    (cached.deploymentMode === "isolated" || cached.deploymentMode === "shared") &&
    Date.now() - cached.cachedAt < CACHE_TTL_MS
  ) {
    return {
      label: cached.label,
      supabaseUrl: cached.supabaseUrl,
      supabaseAnonKey: cached.supabaseAnonKey,
      deploymentMode: cached.deploymentMode,
      hasPolos: cached.hasPolos ?? false,
    };
  }

  const env = (import.meta as unknown as { env: EnvSource }).env;
  const configUrl = env?.VITE_ADMIN_TENANT_CONFIG_URL;

  if (!configUrl) {
    if (cached && (cached.deploymentMode === "isolated" || cached.deploymentMode === "shared")) {
      return {
        label: cached.label,
        supabaseUrl: cached.supabaseUrl,
        supabaseAnonKey: cached.supabaseAnonKey,
        deploymentMode: cached.deploymentMode,
      hasPolos: cached.hasPolos ?? false,
      };
    }

    throw new Error("Dynamic Config Resolver não configurado no ambiente");
  }

  try {
    const res = await fetch(`${configUrl}?code=${encodeURIComponent(normalized)}`);
    if (res.status === 404) throw new Error(`Entidade "${normalized}" não encontrada`);
    if (!res.ok) throw new Error("Configuração da entidade indisponível");

    const data = (await res.json()) as {
      label: string;
      supabaseUrl: string;
      anonKey: string;
      deploymentMode?: "isolated" | "shared";
      hasPolos?: boolean;
    };
    const config: TenantConfig = {
      label: data.label,
      supabaseUrl: data.supabaseUrl,
      supabaseAnonKey: data.anonKey,
      deploymentMode: data.deploymentMode === "shared" ? "shared" : "isolated",
      hasPolos: data.hasPolos ?? false,
    };
    writeConfigCache(normalized, config, "remote");
    return config;
  } catch (err) {
    if (cached && (cached.deploymentMode === "isolated" || cached.deploymentMode === "shared")) {
      const staleConfig = {
        label: cached.label,
        supabaseUrl: cached.supabaseUrl,
        supabaseAnonKey: cached.supabaseAnonKey,
        deploymentMode: cached.deploymentMode,
        hasPolos: cached.hasPolos ?? false,
      };
      writeConfigCache(normalized, staleConfig, "stale");
      return staleConfig;
    }
    throw err;
  }
}
