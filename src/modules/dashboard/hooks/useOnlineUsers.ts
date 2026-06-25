import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase/client";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { useAuth } from "@/modules/auth/context/authContextStore";

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutos
const POLL_INTERVAL_MS = 30_000;

export interface PresenceUser {
  user_id: string;
  user_name: string | null;
  current_route: string | null;
  last_seen_at: string | null;
  isOnline: boolean;
  isSelf: boolean;
}

interface ManagedUserListItem {
  id: string;
  email: string;
  nome: string | null;
  ativo: boolean;
}

interface PresenceRow {
  user_id: string;
  user_name: string | null;
  current_route: string | null;
  last_seen_at: string;
}

export function useOnlineUsers() {
  const { tenantId, unitId, bootstrapped } = useActiveScope();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard", "online-users", unitId ?? "no-unit", tenantId],
    queryFn: async (): Promise<PresenceUser[]> => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error("Sessão autenticada não encontrada.");
      }

      const { data: teamData, error: teamError } = await supabase.functions.invoke("manage-user", {
        body: { action: "list", payload: { activeUnitId: unitId } },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (teamError) throw teamError;

      let query = supabase
        .from("user_presence" as never)
        .select("user_id, user_name, current_route, last_seen_at")
        .order("last_seen_at", { ascending: false });

      if (unitId) {
        query = query.eq("unit_id", unitId);
      } else {
        query = query.is("unit_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;

      const threshold = Date.now() - ONLINE_THRESHOLD_MS;
      const presenceRows = ((data ?? []) as unknown as PresenceRow[]);
      const presenceByUserId = new Map(
        presenceRows.map((row) => [
          row.user_id,
          {
            ...row,
            isOnline: new Date(row.last_seen_at).getTime() > threshold,
          },
        ]),
      );

      return ((teamData as ManagedUserListItem[] | null) ?? [])
        .filter((member) => member.ativo)
        .map((member) => {
          const presence = presenceByUserId.get(member.id);

          return {
            user_id: member.id,
            user_name: presence?.user_name ?? member.nome ?? member.email.split("@")[0] ?? null,
            current_route: presence?.current_route ?? null,
            last_seen_at: presence?.last_seen_at ?? null,
            isOnline: presence?.isOnline ?? false,
            isSelf: member.id === user?.id,
          };
        })
        .sort((a, b) => {
          if (a.isSelf !== b.isSelf) return a.isSelf ? -1 : 1;
          if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
          if (!a.last_seen_at && !b.last_seen_at) return (a.user_name ?? "").localeCompare(b.user_name ?? "");
          if (!a.last_seen_at) return 1;
          if (!b.last_seen_at) return -1;
          return new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime();
        });
    },
    enabled: bootstrapped && !!tenantId && !!user?.id,
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: 0,
  });
}
