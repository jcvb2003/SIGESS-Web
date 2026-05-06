export interface ScriptTenantConfig {
  label: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

type EnvSource = Record<string, string | undefined>;

export function buildTenantsFromEnv(env: EnvSource): Record<string, ScriptTenantConfig> {
  const tenants: Record<string, ScriptTenantConfig> = {};

  for (const [key, value] of Object.entries(env || {})) {
    const match = key.match(/^VITE_SUPABASE_URL_(.+)$/);
    if (!match || !value) continue;

    const envCode = match[1];
    const code = envCode.toLowerCase().replace(/_/g, "-");
    const anonKey = env[`VITE_SUPABASE_ANON_KEY_${envCode}`];
    if (!anonKey) continue;

    tenants[code] = {
      label: env[`VITE_SUPABASE_LABEL_${envCode}`] ?? envCode.replace(/_/g, " "),
      supabaseUrl: value,
      supabaseAnonKey: anonKey,
    };
  }

  return tenants;
}
