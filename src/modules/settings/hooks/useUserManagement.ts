import { useState, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabase/client';
import { toast } from 'sonner';
import { UserRole } from '@/shared/types/auth.types';

export interface User {
  id: string;
  email: string;
  nome: string | null;
  role: UserRole;
  ativo: boolean;
  max_socios: number | null;
  createdAt: string;
  emailConfirmedAt?: string | null;
}

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { action: 'list' }
      });
      if (error) throw error;
      setUsers((data as User[])?.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')) || []);
    } catch (err: unknown) {
      console.error('Erro ao buscar usuários:', err);
      toast.error('Ocorreu um erro ao carregar os usuários');
    } finally {
      setLoading(false);
    }
  }, []);

  const inviteUser = async (payload: { email: string; nome: string; role: string }) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { action: 'invite', payload },
      });
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
    try {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { action: 'create', payload },
      });
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
      const { error } = await supabase.functions.invoke('manage-user', {
        body: { action, payload: { userId, ativo: !currentStatus } },
      });
      if (error) throw error;
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, ativo: !currentStatus } : u
      ));
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
      const { error } = await supabase.functions.invoke('manage-user', {
        body: { action: 'delete', payload: { userId } },
      });
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== userId));
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
      const { error } = await supabase.functions.invoke('manage-user', {
        body: { action: 'resend_confirmation', payload: { email } },
      });
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
