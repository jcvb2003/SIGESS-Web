import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/shared/lib/supabase/client';
import { toast } from 'sonner';
import { UserRole } from '@/shared/types/auth.types';
import { useTenantUnits } from '@/modules/tenant-units/context/TenantUnitContext';
import { administrationService } from '@/modules/administration/services/administrationService';
import { usePermissions } from '@/shared/hooks/usePermissions';

export interface User {
  id: string;
  recordId?: string;
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
  const { activeUnit } = useTenantUnits();
  const { tenantEntityRole } = usePermissions();
  const activeUnitId = activeUnit?.id ?? null;
  const isScopedSharedContext = tenantEntityRole !== null;

  const scopedPayload = useMemo(
    () => (isScopedSharedContext && activeUnitId ? { activeUnitId } : {}),
    [activeUnitId, isScopedSharedContext],
  );

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      if (isScopedSharedContext) {
        const { data, error } = await administrationService.listTenantUsers();
        if (error) throw error;

        const mappedUsers: User[] = (data ?? []).map((row) => {
          const isPresident = row.tenantRole === "owner" || row.operatorType === "presidente";
          return {
            id: row.userId,
            recordId: row.id,
            email: row.email ?? "",
            nome: row.name,
            role: isPresident ? "admin" : "user",
            ativo: row.isActive,
            max_socios: null,
            createdAt: "",
            emailConfirmedAt: null,
            tenantRole: row.tenantRole,
            operatorType: row.operatorType,
          };
        });

        setUsers(mappedUsers.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
        return;
      }

      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'list',
          payload: scopedPayload,
        },
      });

      if (error) throw error;
      setUsers((data as User[])?.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')) || []);
    } catch (err: unknown) {
      console.error('Erro ao buscar usuários:', err);
      toast.error('Ocorreu um erro ao carregar os usuários');
    } finally {
      setLoading(false);
    }
  }, [isScopedSharedContext, scopedPayload]);

  const inviteUser = async (payload: { email: string; nome: string; role: string }) => {
    try {
      if (isScopedSharedContext) {
        const { error } = await administrationService.createTenantUser({
          email: payload.email,
          name: payload.nome,
          tenantRole: "member",
          operatorType: payload.role === "admin" ? "presidente" : "auxiliar",
          mode: "invite",
        });
        if (error) throw error;

        toast.success('Convite enviado com sucesso');
        await fetchUsers();
        return { data: null, error: null };
      }

      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'invite',
          payload: {
            ...payload,
            ...scopedPayload,
          },
        },
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
      if (isScopedSharedContext) {
        const { error } = await administrationService.createTenantUser({
          email: payload.email,
          name: payload.nome,
          tenantRole: "member",
          operatorType: payload.role === "admin" ? "presidente" : "auxiliar",
          mode: "create",
          password: payload.password,
          autoConfirm: payload.email_confirm,
        });
        if (error) throw error;

        toast.success('Usuário criado com sucesso');
        await fetchUsers();
        return { data: null, error: null };
      }

      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'create',
          payload: {
            ...payload,
            ...scopedPayload,
          },
        },
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
      if (isScopedSharedContext) {
        const targetUser = users.find((user) => user.id === userId);
        if (!targetUser?.recordId) {
          throw new Error('Usuário do tenant não encontrado para atualização.');
        }

        const { error } = await administrationService.setTenantUserActive(targetUser.recordId, !currentStatus);
        if (error) throw error;

        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, ativo: !currentStatus } : u
        ));
        toast.success(`Usuário ${currentStatus ? 'desativado' : 'ativado'} com sucesso`);
        return;
      }

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
      if (isScopedSharedContext) {
        const targetUser = users.find((user) => user.id === userId);
        if (!targetUser?.recordId) {
          throw new Error('Usuário do tenant não encontrado para exclusão.');
        }

        const { error } = await administrationService.deleteTenantUser(targetUser.recordId);
        if (error) throw error;

        setUsers(prev => prev.filter(u => u.id !== userId));
        toast.success('Usuário excluído com sucesso');
        return;
      }

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
