import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/shared/lib/supabase/client";

const PROBE_INTERVAL_MS = 15_000;
const PROBE_TIMEOUT_MS = 5_000;

async function checkRealConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

    // Use the already-configured supabase client to probe connectivity,
    // so the correct tenant URL and key are always used.
    await supabase.auth.getSession();

    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

export function useNetworkStatus() {
  const isOnlineRef = useRef(navigator.onLine);
  const toastIdRef = useRef<string | number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goOffline = useCallback(() => {
    if (isOnlineRef.current === false) return;
    isOnlineRef.current = false;

    toastIdRef.current = toast.error("Sem conexão com a internet", {
      description: "Verifique sua conexão de rede",
      duration: Infinity,
      dismissible: false,
    });
  }, []);

  const goOnline = useCallback(() => {
    if (isOnlineRef.current === true) return;
    isOnlineRef.current = true;

    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  }, []);

  const probe = useCallback(async () => {
    const real = await checkRealConnectivity();
    if (real) {
      goOnline();
    } else {
      goOffline();
    }
  }, [goOffline, goOnline]);

  useEffect(() => {
    const handleOffline = () => goOffline();
    const handleOnline = () => probe();

    globalThis.addEventListener("offline", handleOffline);
    globalThis.addEventListener("online", handleOnline);

    intervalRef.current = setInterval(probe, PROBE_INTERVAL_MS);

    probe();

    return () => {
      globalThis.removeEventListener("offline", handleOffline);
      globalThis.removeEventListener("online", handleOnline);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [probe, goOffline]);
}
