import { useAuth } from "@/modules/auth/context/authContextStore";
import { UserRole } from "@/shared/types/auth.types";

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

  return {
    role,
    isAdmin,
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
