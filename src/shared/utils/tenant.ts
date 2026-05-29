import { getCurrentTenantConfig } from "@/config/tenants";
import { authService } from "@/modules/auth/services/authService";
import { supabase } from "@/shared/lib/supabase/client";

let _cachedSharedTenantId: string | null | undefined = undefined;

/**
 * Retorna o tenant_id do usuário atual quando em modo shared.
 * Retorna null em modo isolated sem nenhuma query ao banco.
 */
export async function resolveCurrentSharedTenantId(): Promise<string | null> {
  if (getCurrentTenantConfig()?.deploymentMode !== "shared") return null;

  if (_cachedSharedTenantId !== undefined) return _cachedSharedTenantId;

  const { data: userData } = await authService.getUser();
  const userId = userData?.user?.id;
  if (!userId) {
    _cachedSharedTenantId = null;
    return null;
  }

  const { data, error } = await supabase
    .from("tenant_users" as never)
    .select("tenant_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("[resolveCurrentSharedTenantId] falha ao resolver tenant:", error.message);
    return null;
  }

  _cachedSharedTenantId = (data as { tenant_id?: string } | null)?.tenant_id ?? null;
  return _cachedSharedTenantId;
}

export function clearSharedTenantIdCache(): void {
  _cachedSharedTenantId = undefined;
}
