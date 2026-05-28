import { useEffect, useRef } from "react";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { useTenantUnits } from "../context/TenantUnitContext";
import { tenantUnitService } from "../services/tenantUnitService";

export function TenantUnitBootstrapper() {
  const { session, user } = useAuth();
  const { hydrated, replaceUnits, clearUnits } = useTenantUnits();
  const lastResolvedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!session || !user) {
      lastResolvedUserIdRef.current = null;
      clearUnits();
      return;
    }

    if (lastResolvedUserIdRef.current === user.id) {
      return;
    }

    let cancelled = false;

    const resolveUnits = async () => {
      const { data } = await tenantUnitService.resolveTenantUnits(user);
      lastResolvedUserIdRef.current = user.id;
      if (cancelled) {
        return;
      }

      replaceUnits(
        data?.availableUnits ?? [],
        data?.preferredActiveUnitId ?? null,
      );
    };

    void resolveUnits();

    return () => {
      cancelled = true;
    };
  }, [clearUnits, hydrated, replaceUnits, session, user]);

  return null;
}
