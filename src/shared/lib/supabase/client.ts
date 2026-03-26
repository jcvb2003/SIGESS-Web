import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const tenantConfig: Record<string, { url: string; key: string }> = {
  'apop-sigess': {
    url: import.meta.env.VITE_SUPABASE_URL_APOP || '',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY_APOP || '',
  },
  'entidade1-sigess': {
    url: import.meta.env.VITE_SUPABASE_URL_ENTIDADE1 || '',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY_ENTIDADE1 || '',
  },
};

const subdomain = typeof globalThis !== 'undefined' && globalThis.location ? globalThis.location.hostname.split('.')[0] : '';
const config = tenantConfig[subdomain] ?? {
  url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

if (!config.url || !config.key) {
  throw new Error(`Missing Supabase environment variables for tenant: ${subdomain}`);
}

export const supabase = createClient<Database>(config.url, config.key);
