import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { supabase } from "@/shared/lib/supabase/client";
import { UserRole } from "@/shared/types/auth.types";

function isMissingTenantUsersSchemaError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code ?? "") : "";
  const message = "message" in error ? String(error.message ?? "") : "";
  return code === "42P01" || message.includes("tenant_users");
}

/**
 * Hook para gerenciar as permissões do usuário logado.
 * As permissões são baseadas no `role` presente no `app_metadata` do usuário (Supabase Auth).
 */
export function usePermissions() {
  const { user } = useAuth();

  // O papel (role) é lido do app_metadata injetado no JWT (definido na migration)
  // Caso não exista, assume-se o papel padrão 'user' (Auxiliar)
  const role = (user?.app_metadata?.role as UserRole) ?? 'user';
  const isAdmin = role === 'admin';
  const tenantAdministrationQuery = useQuery({
    queryKey: ["permissions", "tenant-administration", user?.id ?? null],
    enabled: isAdmin && Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_users" as never)
        .select("tenant_id, tenant_role")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (error) {
        if (isMissingTenantUsersSchemaError(error)) {
          return {
            hasTenantAccess: false,
            tenantRole: null,
          };
        }

        throw error;
      }

      const tenantUser = data as
        | { tenant_id?: string | null; tenant_role?: "owner" | "manager" | "member" | null }
        | null;

      return {
        hasTenantAccess: Boolean(tenantUser?.tenant_id),
        tenantRole: tenantUser?.tenant_role ?? null,
      };
    },
  });
  const tenantAdministrationData = tenantAdministrationQuery.data ?? null;
  const canAccessTenantAdministration =
    isAdmin && (tenantAdministrationData?.hasTenantAccess ?? false);
  const tenantEntityRole = tenantAdministrationData?.tenantRole ?? null;
  const isEntityManager =
    tenantEntityRole === "owner" || tenantEntityRole === "manager";

  return {
    role,
    isAdmin,
    canAccessTenantAdministration,
    tenantEntityRole,
    isEntityManager,
    isTenantAdministrationLoading: tenantAdministrationQuery.isLoading,
    // Permissões específicas mapeadas para o papel de administrador (Presidente)
    canCancelPayments: isAdmin,
    canConfigureFinance: isAdmin,
    canReleaseMembers: isAdmin,
    canManageUsers: isAdmin,
    canAccessSettings: isAdmin,
    // Auxiliares podem ver quase tudo, mas não alteram configurações críticas
    isAuxiliar: role === 'user',
  };
}
