import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/shared/lib/supabase/client";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { useActiveScope } from "./useActiveScope";
import { useUserMetadata } from "@/modules/auth/hooks/useUserMetadata";

const HEARTBEAT_INTERVAL_MS = 45_000;

export function usePresenceHeartbeat() {
  const { user } = useAuth();
  const { tenantId, unitId, bootstrapped } = useActiveScope();
  const { metadata } = useUserMetadata();
  const { pathname } = useLocation();

  const pathnameRef = useRef(pathname);
  useEffect(() => { pathnameRef.current = pathname; });

  useEffect(() => {
    if (!bootstrapped || !tenantId || !user?.id) return;

    const upsert = async () => {
      const userName =
        metadata?.profileName ??
        user.email?.split("@")[0] ??
        null;

      try {
        await (supabase.from("user_presence" as never) as unknown as {
          upsert: (
            values: Record<string, unknown>,
            options?: { onConflict?: string },
          ) => PromiseLike<unknown>;
        }).upsert(
          {
            user_id: user.id,
            tenant_id: tenantId,
            unit_id: unitId ?? null,
            user_name: userName,
            last_seen_at: new Date().toISOString(),
            current_route: pathnameRef.current,
          },
          { onConflict: "user_id" },
        );
      } catch (err) {
        console.error("[usePresenceHeartbeat] upsert failed:", err);
      }
    };

    // Primeiro upsert imediato
    void upsert();

    const interval = setInterval(() => void upsert(), HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [bootstrapped, tenantId, unitId, user?.id, metadata?.profileName, user?.email]);
}
