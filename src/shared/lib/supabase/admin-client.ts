import { createClient } from "@supabase/supabase-js";

const ADMIN_URL = import.meta.env.VITE_ADMIN_SUPABASE_URL as string | undefined;
const ADMIN_KEY = import.meta.env.VITE_ADMIN_SUPABASE_ANON_KEY as string | undefined;

let _adminClient: ReturnType<typeof createClient> | null = null;

export function getAdminClient() {
  if (!ADMIN_URL || !ADMIN_KEY) return null;
  if (!_adminClient) {
    _adminClient = createClient(ADMIN_URL, ADMIN_KEY, { auth: { persistSession: false } });
  }
  return _adminClient;
}
