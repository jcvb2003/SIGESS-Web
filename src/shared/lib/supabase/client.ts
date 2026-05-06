import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";
import { resolveTenant, resolveAndCacheTenant, TENANT_CONFIG_CACHE_KEY } from "@/config/tenants";

const TENANT_KEY = 'sigess_tenant';

function injectPreconnect(url: string) {
  if (typeof document !== 'undefined') {
    const existing = document.querySelector(`link[rel="preconnect"][href="${url}"]`);
    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      document.head.appendChild(link);
    }
  }
}

let _client: SupabaseClient<Database> | null = null;

export async function initSupabaseClient(tenantCode: string): Promise<SupabaseClient<Database>> {
  const tenant = await resolveAndCacheTenant(tenantCode);

  const saved = typeof globalThis === 'undefined' ? null : globalThis.localStorage.getItem(TENANT_KEY);
  if (_client && saved === tenantCode) {
    return _client;
  }

  const isPasswordRoute = typeof globalThis !== 'undefined' && globalThis.location.pathname.startsWith('/password');
  _client = createClient<Database>(tenant.supabaseUrl, tenant.supabaseAnonKey, {
    auth: { detectSessionInUrl: !isPasswordRoute }
  });
  injectPreconnect(tenant.supabaseUrl);
  localStorage.setItem(TENANT_KEY, tenantCode);
  return _client;
}



export function getSupabaseClient(): SupabaseClient<Database> {
  if (_client) return _client;

  // Restaurar sessão após o reload
  const saved = typeof globalThis === 'undefined' ? null : globalThis.localStorage.getItem(TENANT_KEY);
  if (saved) {
    // Tenta config cache primeiro (cobre tenants resolvidos dinamicamente)
    try {
      const configRaw = globalThis.localStorage.getItem(TENANT_CONFIG_CACHE_KEY);
      if (configRaw) {
        const cached = JSON.parse(configRaw) as { code: string; supabaseUrl: string; supabaseAnonKey: string };
        if (cached.code === saved && cached.supabaseUrl && cached.supabaseAnonKey) {
          const isPasswordRoute = globalThis.location.pathname.startsWith('/password');
          _client = createClient<Database>(cached.supabaseUrl, cached.supabaseAnonKey, {
            auth: { detectSessionInUrl: !isPasswordRoute }
          });
          injectPreconnect(cached.supabaseUrl);
          return _client;
        }
      }
    } catch { /* ignorar — fallback abaixo */ }

    // Fallback: env map (tenants buildados sem cache ainda)
    const tenant = resolveTenant(saved);
    if (tenant?.supabaseUrl && tenant?.supabaseAnonKey) {
      const isPasswordRoute = typeof globalThis !== 'undefined' && globalThis.location.pathname.startsWith('/password');
      _client = createClient<Database>(tenant.supabaseUrl, tenant.supabaseAnonKey, {
        auth: { detectSessionInUrl: !isPasswordRoute }
      });
      injectPreconnect(tenant.supabaseUrl);
      return _client;
    }
  }

  throw new Error('Nenhuma entidade inicializada. Faça login.');
}

export function clearSupabaseClient(): void {
  _client = null;
  if (typeof globalThis !== 'undefined') {
    globalThis.localStorage.removeItem(TENANT_KEY);
    globalThis.localStorage.removeItem("last_activity_timestamp");
  }
}

export function clearTenantConfigCache(): void {
  if (typeof globalThis !== 'undefined') {
    globalThis.localStorage.removeItem(TENANT_CONFIG_CACHE_KEY);
  }
}

const createNoopStub = (): unknown => {
  const stub = () => stub;
  return new Proxy(stub, {
    get: () => createNoopStub(),
    apply: () => Promise.resolve({ data: null, error: { message: 'Supabase não inicializado', status: 400 } })
  }) as unknown;
};

// Proxy global para os componentes migrarem livremente
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    const client = (() => {
      try { return getSupabaseClient(); }
      catch { return null; }
    })();

    if (!client) {
      // Retorna um stub recursivo que não explode ao acessar propriedades ou chamar métodos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (createNoopStub() as any)[prop as keyof SupabaseClient<Database>];
    }
    
    return client[prop as keyof SupabaseClient<Database>];
  }
});
