import { authService } from "@/modules/auth/services/authService";
import { supabase } from "@/shared/lib/supabase/client";

let _cachedTenantId: string | null | undefined = undefined;

/**
 * Retorna o tenant_id do usuário atual via tenant_users.
 * Usado em queries e RPCs que exigem p_tenant_id explícito.
 */
export async function resolveTenantIdViaTenantUsers(): Promise<string | null> {
  if (_cachedTenantId !== undefined) return _cachedTenantId;

  const { data: userData } = await authService.getUser();
  const userId = userData?.user?.id;
  if (!userId) {
    _cachedTenantId = null;
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
    console.warn("[resolveTenantIdViaTenantUsers] falha ao resolver tenant:", error.message);
    _cachedTenantId = null;
    return null;
  }

  _cachedTenantId = (data as { tenant_id?: string } | null)?.tenant_id ?? null;
  return _cachedTenantId;
}

export function clearSharedTenantIdCache(): void {
  _cachedTenantId = undefined;
}
