import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase/client";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { useAuth } from "@/modules/auth/context/authContextStore";

const ONLINE_THRESHOLD_MINUTES = 2;
const POLL_INTERVAL_MS = 30_000;

export interface OnlineUser {
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
    queryFn: async (): Promise<OnlineUser[]> => {
      const threshold = new Date(
        Date.now() - ONLINE_THRESHOLD_MINUTES * 60 * 1000,
      ).toISOString();

      let query = (supabase.from("user_presence" as never) as ReturnType<typeof supabase.from>)
        .select("user_id, user_name, current_route, last_seen_at")
        .gt("last_seen_at", threshold)
        .neq("user_id", user?.id ?? "");

      // Por polo quando há polo; por tenant sem polo (unit_id is null)
      if (unitId) {
        query = query.eq("unit_id", unitId);
      } else {
        query = query.is("unit_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as OnlineUser[];
    },
    enabled: bootstrapped && !!tenantId && !!user?.id,
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: 0,
  });
}
