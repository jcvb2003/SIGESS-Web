export type Topology =
  | "isolated_single"
  | "isolated_polo"
  | "shared_multi_single"
  | "shared_multi_polo"
  | "shared_hybrid"
  | "unconfigured";

export interface TenantConfig {
  label: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  topology: Topology;
}

export function isSharedTopology(topology: Topology): boolean {
  return topology.startsWith("shared");
}

export function hasPoloTopology(topology: Topology): boolean {
  return topology === "isolated_polo" || topology === "shared_multi_polo" || topology === "shared_hybrid";
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

function isValidTopology(value: unknown): value is Topology {
  return (
    typeof value === "string" &&
    [
      "isolated_single",
      "isolated_polo",
      "shared_multi_single",
      "shared_multi_polo",
      "shared_hybrid",
      "unconfigured",
    ].includes(value)
  );
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

    return isValidTopology(cached.topology) ? cached : null;
  } catch {
    return null;
  }
}

export function getCachedTenantConfig(code?: string): TenantConfig | null {
  const cached = readConfigCacheEntry(code);
  if (!cached) return null;

  return {
    label: cached.label,
    supabaseUrl: cached.supabaseUrl,
    supabaseAnonKey: cached.supabaseAnonKey,
    topology: cached.topology,
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
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return {
      label: cached.label,
      supabaseUrl: cached.supabaseUrl,
      supabaseAnonKey: cached.supabaseAnonKey,
      topology: cached.topology,
    };
  }

  const env = (import.meta as unknown as { env: EnvSource }).env;
  const configUrl = env?.VITE_ADMIN_TENANT_CONFIG_URL;

  if (!configUrl) {
    if (cached) {
      return {
        label: cached.label,
        supabaseUrl: cached.supabaseUrl,
        supabaseAnonKey: cached.supabaseAnonKey,
        topology: cached.topology,
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
      topology?: string;
    };

    if (!isValidTopology(data.topology)) {
      throw new Error(`Topologia inválida ou ausente na resposta: "${data.topology}"`);
    }

    const topology: Topology = data.topology;

    const config: TenantConfig = {
      label: data.label,
      supabaseUrl: data.supabaseUrl,
      supabaseAnonKey: data.anonKey,
      topology,
    };
    writeConfigCache(normalized, config, "remote");
    return config;
  } catch (err) {
    if (cached) {
      writeConfigCache(normalized, {
        label: cached.label,
        supabaseUrl: cached.supabaseUrl,
        supabaseAnonKey: cached.supabaseAnonKey,
        topology: cached.topology,
      }, "stale");
      return {
        label: cached.label,
        supabaseUrl: cached.supabaseUrl,
        supabaseAnonKey: cached.supabaseAnonKey,
        topology: cached.topology,
      };
    }
    throw err;
  }
}
