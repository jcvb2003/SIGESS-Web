import { useCallback, useMemo, useState } from 'react';
import { supabase } from '@/shared/lib/supabase/client';
import { toast } from 'sonner';
import { UserRole } from '@/shared/types/auth.types';
import { useTenantUnits } from '@/modules/tenant-units/context/TenantUnitContext';

export interface User {
  id: string;
  email: string;
  nome: string | null;
  role: UserRole;
  ativo: boolean;
  max_socios: number | null;
  createdAt: string;
  emailConfirmedAt?: string | null;
  tenantRole?: "owner" | "member" | null;
  operatorType?: "presidente" | "auxiliar" | null;
}

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { activeUnit, bootstrapped } = useTenantUnits();

  const activeUnitId = activeUnit?.id ?? null;
  const tenantCode =
    typeof globalThis === "undefined" ? null : globalThis.localStorage.getItem("sigess_tenant");

  const scopedPayload = useMemo(
    () => ({
      ...(activeUnitId ? { activeUnitId } : {}),
      ...(tenantCode ? { tenantCode } : {}),
    }),
    [activeUnitId, tenantCode],
  );

  const sortUsers = useCallback((items: User[]) => (
    items.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
  ), []);

  const invokeManageUser = useCallback(
    async (action: string, payload: Record<string, unknown>) => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error('Sessão autenticada não encontrada.');
      }

      return supabase.functions.invoke('manage-user', {
        body: { action, payload },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    },
    [],
  );

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await invokeManageUser('list', scopedPayload);
      if (error) throw error;
      setUsers(sortUsers((data as User[]) || []));
    } catch (err: unknown) {
      console.error('Erro ao buscar usuários:', err);
      toast.error('Ocorreu um erro ao carregar os usuários');
    } finally {
      setLoading(false);
    }
  }, [invokeManageUser, scopedPayload, sortUsers]);

  const inviteUser = async (payload: { email: string; nome: string; role: string }) => {
    if (!bootstrapped) {
      return { data: null, error: new Error('Contexto de polos ainda não carregado.') };
    }

    try {
      const { data, error } = await invokeManageUser('invite', { ...payload, ...scopedPayload });
      if (error) throw error;
      toast.success('Convite enviado com sucesso');
      await fetchUsers();
      return { data, error: null };
    } catch (err: unknown) {
      console.error('Erro ao convidar usuário:', err);
      toast.error('Erro ao enviar convite');
      return { data: null, error: err };
    }
  };

  const createUser = async (payload: {
    email: string;
    nome: string;
    role: string;
    password?: string;
    email_confirm?: boolean;
  }) => {
    if (!bootstrapped) {
      return { data: null, error: new Error('Contexto de polos ainda não carregado.') };
    }

    try {
      const { data, error } = await invokeManageUser('create', { ...payload, ...scopedPayload });
      if (error) throw error;
      toast.success('Usuário criado com sucesso');
      await fetchUsers();
      return { data, error: null };
    } catch (err: unknown) {
      console.error('Erro ao criar usuário:', err);
      toast.error('Erro ao criar usuário com senha');
      return { data: null, error: err };
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const action = currentStatus ? 'deactivate' : 'activate';
      const { error } = await invokeManageUser(action, { userId, ativo: !currentStatus });
      if (error) throw error;

      setUsers((prev) => prev.map((user) => (
        user.id === userId ? { ...user, ativo: !currentStatus } : user
      )));

      toast.success(`Usuário ${currentStatus ? 'desativado' : 'ativado'} com sucesso`);
    } catch (err: unknown) {
      console.error('Erro ao alterar status:', err);
      toast.error('Erro ao alterar status (verifique permissões)');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    setLoading(true);
    try {
      const { error } = await invokeManageUser('delete', { userId });
      if (error) throw error;
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      toast.success('Usuário excluído com sucesso');
    } catch (err: unknown) {
      console.error('Erro ao excluir usuário:', err);
      toast.error('Erro ao excluir usuário');
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await invokeManageUser('resend_confirmation', { email, ...scopedPayload });
      if (error) throw error;
      toast.success('Link de confirmação reenviado com sucesso');
    } catch (err: unknown) {
      console.error('Erro ao reenviar confirmação:', err);
      toast.error('Erro ao reenviar link de confirmação');
    }
  };

  return {
    users,
    loading,
    fetchUsers,
    toggleUserStatus,
    inviteUser,
    createUser,
    deleteUser,
    resendConfirmation,
  };
}
