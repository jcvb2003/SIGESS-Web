import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";
import { resolveTenant } from "@/config/tenants";

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

export function initSupabaseClient(tenantCode: string): SupabaseClient<Database> {
  const tenant = resolveTenant(tenantCode);
  if (!tenant) throw new Error('Entidade não encontrada');

  if (!tenant.supabaseUrl || !tenant.supabaseAnonKey) {
    throw new Error(`Entidade não encontrada: ${tenantCode}`);
  }

  const saved = typeof globalThis === 'undefined' ? null : globalThis.localStorage.getItem(TENANT_KEY);
  if (_client && saved === tenantCode) {
    return _client;
  }

  _client = createClient<Database>(tenant.supabaseUrl, tenant.supabaseAnonKey);
  injectPreconnect(tenant.supabaseUrl);
  localStorage.setItem(TENANT_KEY, tenantCode);
  return _client;
}

/**
 * Inicializa o cliente Supabase em modo legado, usando as variáveis de ambiente
 * genéricas (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) dos projetos antigos da Vercel.
 * NÃO persiste tenant no localStorage — o cliente é recriado a cada sessão.
 */
export function initLegacyClient(): SupabaseClient<Database> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) {
    throw new Error('Variáveis de ambiente legadas (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) não configuradas.');
  }
  if (_client) return _client;
  _client = createClient<Database>(url, key);
  injectPreconnect(url);
  return _client;
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (_client) return _client;

  // Restaurar sessão após o reload
  const saved = typeof globalThis === 'undefined' ? null : globalThis.localStorage.getItem(TENANT_KEY);
  if (saved) {
    const tenant = resolveTenant(saved);
    if (tenant?.supabaseUrl && tenant?.supabaseAnonKey) {
      _client = createClient<Database>(tenant.supabaseUrl, tenant.supabaseAnonKey);
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

