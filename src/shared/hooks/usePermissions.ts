import { useQuery } from "@tanstack/react-query";
import { getCurrentTenantConfig } from "@/config/tenants";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { supabase } from "@/shared/lib/supabase/client";
import { UserRole } from "@/shared/types/auth.types";
import { isGestorRole } from "@/shared/utils/roleHelpers";

function isMissingTenantUsersSchemaError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; message?: string; status?: number };
  const code = String(candidate.code ?? "");
  const message = String(candidate.message ?? "");
  return (
    candidate.status === 404 ||
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("tenant_users")
  );
}

/**
 * Hook para gerenciar as permissões do usuário logado.
 * As permissões são baseadas no `role` presente no `app_metadata` do usuário (Supabase Auth).
 */
export function usePermissions() {
  const { user } = useAuth();
  const tenantConfig = getCurrentTenantConfig();

  // O papel (role) é lido do app_metadata injetado no JWT (definido na migration)
  // Caso não exista, assume-se o papel padrão 'user' (Auxiliar)
  const authRole = (user?.app_metadata?.role as UserRole) ?? "user";
  const isSharedTenant = tenantConfig?.deploymentMode === "shared";

  const tenantAdministrationQuery = useQuery({
    queryKey: ["permissions", "tenant-administration", user?.id ?? null, tenantConfig?.deploymentMode ?? null],
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

      if (error) {
        if (isMissingTenantUsersSchemaError(error)) {
          return {
            hasTenantAccess: false,
            tenantRole: null,
            operatorType: null,
          };
        }

        throw error;
      }

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

  const tenantAdministrationData =
    tenantAdministrationQuery.data ??
    (isSharedTenant
      ? null
        : {
            hasTenantAccess: false,
            tenantRole: null,
            operatorType: null,
          });

  const tenantOperatorType = tenantAdministrationData?.operatorType ?? null;
  const tenantEntityRole = tenantAdministrationData?.tenantRole ?? null;
  const isPresidentRole = tenantOperatorType === "presidente";
  const role = authRole === "admin" || isPresidentRole ? "admin" : authRole;
  const isAdmin = role === "admin";
  const canAccessTenantAdministration = tenantEntityRole === "owner";
  const isEntityManager = isGestorRole(tenantEntityRole);

  // Em shared: apenas o gestor (owner) pode alterar configurações globais da entidade.
  // Em isolated: qualquer admin pode (não há distinção de papel dentro da entidade).
  const canManageEntitySettings = isSharedTenant ? isAdmin : isAdmin;

  return {
    role,
    isAdmin,
    canAccessTenantAdministration,
    tenantEntityRole,
    tenantOperatorType,
    isEntityManager,
    isTenantAdministrationLoading: tenantAdministrationQuery.isLoading,
    canManageEntitySettings,
    // Permissões específicas mapeadas para o papel de administrador (Presidente)
    canCancelPayments: isAdmin,
    canConfigureFinance: isAdmin,
    canReleaseMembers: isAdmin,
    canManageUsers: isAdmin,
    canAccessSettings: isAdmin,
    // Auxiliares podem ver quase tudo, mas não alteram configurações críticas
    isAuxiliar: role === "user",
  };
}
