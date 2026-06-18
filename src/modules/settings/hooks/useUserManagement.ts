import { useCallback, useMemo, useState } from 'react';
import { supabase } from '@/shared/lib/supabase/client';
import { toast } from 'sonner';
import { UserRole } from '@/shared/types/auth.types';
import { useActiveScope } from '@/shared/hooks/useActiveScope';
import { useAuth } from '@/modules/auth/context/authContextStore';

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
  avatarPath?: string | null;
  avatarUrl?: string | null;
}

const AVATAR_BUCKET = "avatars";
const AVATAR_URL_TTL_SECONDS = 60 * 30;

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { unitId: activeUnitId, bootstrapped } = useActiveScope();
  const { user: currentUser } = useAuth();
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
    items.sort((a, b) => {
      if (a.id === currentUser?.id && b.id !== currentUser?.id) return -1;
      if (b.id === currentUser?.id && a.id !== currentUser?.id) return 1;
      return (a.nome || '').localeCompare(b.nome || '');
    })
  ), [currentUser?.id]);

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
      const baseUsers = (data as User[]) || [];

      const { data: tenantProfiles, error: profileError } = await supabase
        .from("tenant_users" as never)
        .select("user_id, user_profiles(avatar_path)")
        .eq("is_active", true);

      if (profileError) throw profileError;

      const avatarPathByUserId = new Map(
        ((tenantProfiles ?? []) as {
          user_id: string;
          user_profiles?: { avatar_path?: string | null } | null;
        }[]).map((row) => [
          row.user_id,
          row.user_profiles?.avatar_path ?? null,
        ]),
      );

      const usersWithAvatarPath = baseUsers.map((user) => ({
        ...user,
        avatarPath: avatarPathByUserId.get(user.id) ?? null,
      }));

      const signedUrlEntries = await Promise.all(
        usersWithAvatarPath.map(async (user) => {
          if (!user.avatarPath) return [user.id, null] as const;

          const { data: signed, error: signedError } = await supabase.storage
            .from(AVATAR_BUCKET)
            .createSignedUrl(user.avatarPath, AVATAR_URL_TTL_SECONDS);

          if (signedError) {
            console.error("Erro ao resolver avatar do usuário:", signedError);
            return [user.id, null] as const;
          }

          return [user.id, signed?.signedUrl ?? null] as const;
        }),
      );

      const avatarUrlByUserId = new Map(signedUrlEntries);

      setUsers(
        sortUsers(
          usersWithAvatarPath.map((user) => ({
            ...user,
            avatarUrl: avatarUrlByUserId.get(user.id) ?? null,
          })),
        ),
      );
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
