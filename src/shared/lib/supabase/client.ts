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
     throw new Error(`Variáveis de ambiente ausentes para o código: ${tenantCode}`);
  }

  _client = createClient<Database>(tenant.supabaseUrl, tenant.supabaseAnonKey);
  injectPreconnect(tenant.supabaseUrl);
  localStorage.setItem(TENANT_KEY, tenantCode);
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

// Proxy global para os componentes migrarem livremente
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient<Database>];
  }
});
