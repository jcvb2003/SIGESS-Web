import { useQuery } from "@tanstack/react-query";
import { getCurrentTenantConfig } from "@/config/tenants";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { supabase } from "@/shared/lib/supabase/client";
import { UserRole } from "@/shared/types/auth.types";
/**
 * Hook para gerenciar as permissões do usuário logado.
 * As permissões são baseadas no `role` presente no `app_metadata` do usuário (Supabase Auth).
 */
export function usePermissions() {
  const { user } = useAuth();
  const tenantConfig = getCurrentTenantConfig();

  const authRole = (user?.app_metadata?.role as UserRole) ?? "user";

  const tenantAdministrationQuery = useQuery({
    queryKey: ["permissions", "tenant-administration", user?.id ?? null, tenantConfig?.topology ?? null],
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_users" as never)
        .select("tenant_id, tenant_role, operator_type")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      const tenantUser = data as
        | {
            tenant_id?: string | null;
            tenant_role?: "owner" | "member" | null;
            operator_type?: "presidente" | "auxiliar" | null;
          }
        | null;

      return {
        hasTenantAccess: tenantUser?.tenant_role === "owner",
        tenantRole: tenantUser?.tenant_role ?? null,
        operatorType: tenantUser?.operator_type ?? null,
      };
    },
  });

  const tenantAdministrationData = tenantAdministrationQuery.data ?? null;

  const tenantOperatorType = tenantAdministrationData?.operatorType ?? null;
  const tenantEntityRole = tenantAdministrationData?.tenantRole ?? null;
  const isPresidentRole = tenantOperatorType === "presidente";
  const role = authRole === "admin" || isPresidentRole ? "admin" : authRole;
  const isAdmin = role === "admin";
  const canAccessTenantAdministration = tenantEntityRole === "owner";
  const canManageEntitySettings = isAdmin;
  const canManageCustomization = isAdmin || tenantEntityRole === "owner";

  return {
    role,
    isAdmin,
    canAccessTenantAdministration,
    tenantEntityRole,
    tenantOperatorType,
    isTenantAdministrationLoading: tenantAdministrationQuery.isLoading,
    canManageEntitySettings,
    canManageCustomization,
    canCancelPayments: isAdmin,
    canConfigureFinance: isAdmin,
    canReleaseMembers: isAdmin,
    canManageUsers: isAdmin,
    canAccessSettings: isAdmin,
    isAuxiliar: role === "user",
  };
}
