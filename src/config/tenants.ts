export interface TenantConfig {
  label: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export const TENANTS: Record<string, TenantConfig> = {
  'z2': {
    label: 'Colônia Z-2 de Salvaterra',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL_Z2 || import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_Z2 || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  'sinpesca-breves': {
    label: 'SINPESCA — Polo Breves Eliseu',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL_SINPESCA_BREVES || import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_SINPESCA_BREVES || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
}

export function resolveTenant(code: string): TenantConfig | null {
  if (!code) return null;
  return TENANTS[code.toLowerCase().trim()] ?? null;
}
