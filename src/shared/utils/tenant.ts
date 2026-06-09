import { authService } from "@/modules/auth/services/authService";
import { supabase } from "@/shared/lib/supabase/client";

let _cachedSharedTenantId: string | null | undefined = undefined;
let _cachedRpcTenantId: string | null | undefined = undefined;

/**
 * Retorna o tenant_id do usuário atual para todas as topologias.
 */
export async function resolveCurrentSharedTenantId(): Promise<string | null> {
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

/**
 * Retorna o tenant_id via tenant_users para uso em funções SECURITY DEFINER
 * que exigem p_tenant_id explícito (contornam RLS e não podem depender do contexto implícito).
 * Pressupõe que o usuário tem vínculo ativo em tenant_users — não cobre usuários
 * representados exclusivamente por user_unit_memberships sem entrada em tenant_users.
 */
export async function resolveTenantIdViaTenantUsers(): Promise<string | null> {
  if (_cachedRpcTenantId !== undefined) return _cachedRpcTenantId;

  const { data: userData } = await authService.getUser();
  const userId = userData?.user?.id;
  if (!userId) {
    _cachedRpcTenantId = null;
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
    console.warn("[resolveTenantIdForRpc] falha ao resolver tenant:", error.message);
    _cachedRpcTenantId = null;
    return null;
  }

  _cachedRpcTenantId = (data as { tenant_id?: string } | null)?.tenant_id ?? null;
  return _cachedRpcTenantId;
}

/** @deprecated use resolveTenantIdViaTenantUsers */
export const resolveTenantIdForRpc = resolveTenantIdViaTenantUsers;

export function clearSharedTenantIdCache(): void {
  _cachedSharedTenantId = undefined;
  _cachedRpcTenantId = undefined;
}
