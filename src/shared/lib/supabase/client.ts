import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";
import {
  clearTenantConfigCache as clearTenantConfigCacheEntry,
  getCachedTenantConfig,
  normalizeTenantCode,
  resolveAndCacheTenant,
} from "@/config/tenants";

const TENANT_KEY = "sigess_tenant";

function injectPreconnect(url: string) {
  if (typeof document !== "undefined") {
    const existing = document.querySelector(`link[rel="preconnect"][href="${url}"]`);
    if (!existing) {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = url;
      document.head.appendChild(link);
    }
  }
}

let _client: SupabaseClient<Database> | null = null;

export async function initSupabaseClient(tenantCode: string): Promise<SupabaseClient<Database>> {
  const normalizedCode = normalizeTenantCode(tenantCode);
  const tenant = await resolveAndCacheTenant(normalizedCode);

  const saved =
    typeof globalThis === "undefined" ? null : globalThis.localStorage.getItem(TENANT_KEY);
  if (_client && saved === normalizedCode) {
    return _client;
  }

  const isPasswordRoute =
    typeof globalThis !== "undefined" && globalThis.location.pathname.startsWith("/password");

  _client = createClient<Database>(tenant.supabaseUrl, tenant.supabaseAnonKey, {
    auth: { detectSessionInUrl: !isPasswordRoute },
  });

  injectPreconnect(tenant.supabaseUrl);
  localStorage.setItem(TENANT_KEY, normalizedCode);
  return _client;
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (_client) return _client;

  const saved =
    typeof globalThis === "undefined" ? null : globalThis.localStorage.getItem(TENANT_KEY);
  if (saved) {
    const tenant = getCachedTenantConfig(saved);
    if (tenant?.supabaseUrl && tenant?.supabaseAnonKey) {
      const isPasswordRoute =
        typeof globalThis !== "undefined" && globalThis.location.pathname.startsWith("/password");

      _client = createClient<Database>(tenant.supabaseUrl, tenant.supabaseAnonKey, {
        auth: { detectSessionInUrl: !isPasswordRoute },
      });

      injectPreconnect(tenant.supabaseUrl);
      return _client;
    }
  }

  throw new Error("Nenhuma entidade inicializada. Faça login.");
}

export function clearSupabaseClient(): void {
  _client = null;
  if (typeof globalThis !== "undefined") {
    globalThis.localStorage.removeItem(TENANT_KEY);
    globalThis.localStorage.removeItem("last_activity_timestamp");
  }
}

export function clearTenantConfigCache(): void {
  clearTenantConfigCacheEntry();
}

const createNoopStub = (): unknown => {
  const stub = () => stub;
  return new Proxy(stub, {
    get: () => createNoopStub(),
    apply: () =>
      Promise.resolve({
        data: null,
        error: { message: "Supabase não inicializado", status: 400 },
      }),
  }) as unknown;
};

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    const client = (() => {
      try {
        return getSupabaseClient();
      } catch {
        return null;
      }
    })();

    if (!client) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (createNoopStub() as any)[prop as keyof SupabaseClient<Database>];
    }

    return client[prop as keyof SupabaseClient<Database>];
  },
});
