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
}

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      /**
       * Nota de RLS (N-01):
       * A policy foi corrigida via migration 20240407_ph1_hardening.sql.
       * Agora admins autenticados podem listar todos os usuários nativamente
       * sem necessidade de bypass ou Edge Functions para visualização.
       */
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .order('nome');

      if (error) throw error;
      setUsers((data as unknown as User[]) || []);
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
        body: { action, payload: { userId } },
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

  return {
    users,
    loading,
    fetchUsers,
    toggleUserStatus,
    inviteUser,
    createUser
  };
}
