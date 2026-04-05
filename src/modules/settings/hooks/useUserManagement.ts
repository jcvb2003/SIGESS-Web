import { isLegacyMode, LEGACY_TENANT_CODE } from "@/config/appMode";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase/client";
import { toast } from "sonner";

export interface UserAccount {
  id: string;
  email: string;
  nome: string | null;
  role: 'admin' | 'user';
  ativo: boolean;
  created_at: string;
}

export function useUserManagement() {
  const queryClient = useQueryClient();

  // 1. Buscar todos os usuários do banco (permitido apenas para admins via RLS)
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['system-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .order('role', { ascending: true }) // Admins primeiro
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return (data as unknown) as UserAccount[];

    }
  });

  // 2. Convidar/Criar Usuário (Chama a Edge Function)
  const manageUserMutation = useMutation({
    mutationFn: async ({ action, payload }: { action: string, payload: Record<string, unknown> }) => {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { action, payload }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro na operação: ${error.message}`);
    }
  });

  const inviteUser = async (email: string, nome: string, role: 'admin' | 'user') => {
    let tenantCode = typeof globalThis !== 'undefined' && globalThis.localStorage 
      ? (globalThis.localStorage.getItem('sigess_tenant') ?? '') 
      : '';
      
    if (!tenantCode && isLegacyMode && LEGACY_TENANT_CODE) {
      tenantCode = LEGACY_TENANT_CODE;
    }

    toast.promise(
      manageUserMutation.mutateAsync({
        action: 'invite',
        payload: { email, nome, role, tenantCode }
      }),
      {
        loading: 'Enviando convite...',
        success: 'Convite enviado com sucesso!',
        error: 'Erro ao enviar convite.'
      }
    );
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    toast.promise(
      manageUserMutation.mutateAsync({
        action,
        payload: { userId }
      }),
      {
        loading: currentStatus ? 'Desativando usuário...' : 'Ativando usuário...',
        success: currentStatus ? 'Usuário desativado.' : 'Usuário ativado.',
        error: 'Erro ao alterar status.'
      }
    );
  };

  return {
    users,
    isLoading,
    inviteUser,
    toggleUserStatus,
    isProcessing: manageUserMutation.isPending
  };
}
