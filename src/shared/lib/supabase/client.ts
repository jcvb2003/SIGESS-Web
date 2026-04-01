import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const genericConfig = {
  url: (import.meta.env.VITE_SUPABASE_URL || '').trim(),
  key: (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim(),
};

const subdomain = typeof globalThis !== 'undefined' && globalThis.location 
  ? globalThis.location.hostname.split('.')[0] 
  : '';

const tenantConfig: Record<string, { url?: string; key?: string }> = {
  'apop-sigess': {
    url: import.meta.env.VITE_SUPABASE_URL_APOP,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY_APOP,
  },
  'entidade1-sigess': {
    url: import.meta.env.VITE_SUPABASE_URL_ENTIDADE1,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY_ENTIDADE1,
  },
};

const specific = tenantConfig[subdomain];

const config = {
  url: (specific?.url && specific.url !== 'undefined' ? specific.url : genericConfig.url).trim(),
  key: (specific?.key && specific.key !== 'undefined' ? specific.key : genericConfig.key).trim(),
};

if (!config.url || !config.key || config.url === 'undefined' || config.key === 'undefined') {
  console.error('[Supabase] CRITICAL: Invalid configuration for tenant:', subdomain, {
    url: config.url ? 'provided' : 'missing',
    key: config.key ? 'provided' : 'missing',
    subdomain
  });
  throw new Error(`Missing or invalid Supabase environment variables for tenant: ${subdomain}`);
}

export const supabase = createClient<Database>(config.url, config.key);
